// DialogUtils.ts

import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import Input from "sap/m/Input";
import StepInput from "sap/m/StepInput";
import Slider from "sap/m/Slider";
import Button from "sap/m/Button";
import TextArea from "sap/m/TextArea";
import MessageToast from "sap/m/MessageToast";
import VBox from "sap/m/VBox";
import { invokeLLMAction } from "./LLMUtils";

/**
 * Opens the hyperparameters configuration dialog.
 */
export function openHyperparametersDialog(oView: any): void {
  const oController = oView.getController();
  const hyperparams = (oController as any)._hyperparams || {
    tone: "",
    maxTokens: 1000,
    temperature: 0.7,
  };

  const oDialog: Dialog = new Dialog({
    title: "Configure AI Hyperparameters",
    contentWidth: "400px",
    content: [
      new Label({ text: "Tone", labelFor: "toneInput", width: "100%" }),
      new Input("toneInput", {
        placeholder: "e.g. friendly, formal, creative...",
        width: "100%",
        value: hyperparams.tone,
      }),
      new Label({
        text: "Max Tokens",
        labelFor: "tokenStepInput",
        width: "100%",
      }),
      new StepInput("tokenStepInput", {
        min: 1,
        max: 8000,
        step: 100,
        value: hyperparams.maxTokens,
        description: "tokens",
        width: "100%",
      }),
      new Label({
        text: "Temperature",
        labelFor: "temperatureSlider",
        width: "100%",
      }),
      new Slider("temperatureSlider", {
        min: 0,
        max: 1,
        step: 0.1,
        value: hyperparams.temperature,
        width: "100%",
      }),
    ],
    buttons: [
      new Button({
        text: "Save",
        type: "Emphasized",
        press: () => {
          const sTone = (
            sap.ui.getCore().byId("toneInput") as Input
          ).getValue();
          const iTokens = (
            sap.ui.getCore().byId("tokenStepInput") as StepInput
          ).getValue();
          const fTemperature = (
            sap.ui.getCore().byId("temperatureSlider") as Slider
          ).getValue();

          (oController as any)._hyperparams = {
            tone: sTone,
            maxTokens: iTokens,
            temperature: fTemperature,
          };
          oDialog.close();
        },
      }),
      new Button({
        text: "Cancel",
        press: () => oDialog.close(),
      }),
    ],
    afterClose: () => oDialog.destroy(),
  }).addStyleClass("sapUiContentPadding");

  oView.addDependent(oDialog);
  oDialog.open();
}

/**
 * Shows a confirmation dialog and resolves or rejects a promise.
 */
export function confirmReportDialog(oView: any): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const oDialog: Dialog = new Dialog({
      title: "Confirm Report",
      content: [
        new VBox({
          // Provide full width so margins look good
          width: "100%",
          items: [
            new Label({
              text: "Are you sure you want to confirm this report?",
              textAlign: "Center",
              width: "100%",
            }),
            new Label({
              text: "This involves sending the selected data to an LLM.",
              textAlign: "Center",
              width: "100%",
            }),
          ],
        }),
      ],
      buttons: [
        new Button({
          text: "Yes",
          press: function () {
            resolve();
            oDialog.close();
          },
        }),
        new Button({
          text: "No",
          press: function () {
            reject();
            oDialog.close();
          },
        }),
      ],
      afterClose: () => oDialog.destroy(),
    }).addStyleClass("sapUiContentPadding");

    oView.addDependent(oDialog);
    oDialog.open();
  });
}

/**
 * Opens a dialog that displays and lets the user edit the generated report.
 */
export function handleGeneratedReport(response: any): void {
  const textArea = new TextArea({
    value: response,
    width: "100%",
    rows: 10,
  });

  let dialog: Dialog;

  dialog = new Dialog({
    title: "Edit Report",
    contentWidth: "800px",
    contentHeight: "400px",
    content: [textArea],
    beginButton: new Button({
      text: "Save",
      press: () => {
        dialog.close();
        MessageToast.show("Report successfully generated and edited.");
      },
    }),
    endButton: new Button({
      text: "Cancel",
      press: () => dialog.close(),
    }),
    afterClose: () => dialog.destroy(),
  });

  textArea
    .attachLiveChange((event) => {
      const area = event.getSource() as TextArea;
      dialog.data("editedData", area.getValue());
    })
    .addStyleClass("sapUiContentPadding");

  dialog.open();
}

/**
 * Opens a chat dialog for users to interact with an LLM.
 */
export function openChatDialog(oView: any): void {
  const oController = oView.getController();
  const aMessages = (oController as any)._chatMessages || [];

  // A UI element (List) to hold incoming/outgoing messages

  // A simple Input field where the user can type a new message
  const oUserInput = new Input("chatInput", {
    width: "80%",
    placeholder: "Type your message here...",
  });

  // Send button: triggers LLM call
  const oSendButton = new Button({
    text: "Send",
    type: "Emphasized",
    press: async () => {
      const sText = oUserInput.getValue();
      if (!sText) {
        MessageToast.show("Please enter a message.");
        return;
      }

      const response = await invokeLLMAction(
        oView,
        "Translate this text into a invented language: {{?content}} {{?tone}}",
        sText
      );

      // 1. Add user message to the list (client-side)

      // 2. Clear input
      oUserInput.setValue("");

      // 3. Call LLM service
    },
  });

  // Put the Input and Send button on a single line
  const oUserInputLayout = new VBox({
    items: [oUserInput, oSendButton],
    width: "100%",
  }).addStyleClass("sapUiSmallMarginTop");

  // Create the dialog
  const oChatDialog: Dialog = new Dialog({
    title: "AI Chat",
    contentWidth: "500px",
    contentHeight: "400px",
    horizontalScrolling: true,
    verticalScrolling: true,
    content: [oUserInputLayout],
    buttons: [
      new Button({
        text: "Close",
        press: () => oChatDialog.close(),
      }),
    ],
    afterClose: () => {
      // Cleanup: destroy the dialog after close to avoid memory leaks
      oChatDialog.destroy();
    },
  }).addStyleClass("sapUiContentPadding");

  // Add the dialog as a dependent of the view and open
  oView.addDependent(oChatDialog);
  oChatDialog.open();
}

function collectSelectedContent(oView: any) {
  const oController = oView.getController();
  const oEditFlow = oController.getExtensionAPI().editFlow;

  const contextsSelected = oEditFlow
    .getView()
    .byId(
      "sap.fe.cap.travel::TravelList--fe::table::Travel::LineItem-innerTable"
    )
    .getSelectedContexts();

  const content = contextsSelected.map((context: any) => context.getObject());

  return content;
}
