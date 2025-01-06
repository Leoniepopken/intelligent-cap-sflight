// DialogUtils.ts

import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import Input from "sap/m/Input";
import StepInput from "sap/m/StepInput";
import Slider from "sap/m/Slider";
import Button from "sap/m/Button";
import TextArea from "sap/m/TextArea";
import MessageToast from "sap/m/MessageToast";
import List from "sap/m/List";
import VBox from "sap/m/VBox";
import CustomListItem from "sap/m/CustomListItem";
import HBox from "sap/m/HBox";
import Control from "sap/ui/core/Control";

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
  // Optional: If you have a controller property for messages, retrieve it.
  const oController = oView.getController();
  const aMessages = (oController as any)._chatMessages || [];

  // A UI element (List) to hold incoming/outgoing messages
  const oMessageList = new List("messageList", {
    items: aMessages.map((msg: any) => {
      return createMessageItem(msg.sender, msg.text);
    }),
  });

  // A simple Input field where the user can type a new message
  const oUserInput = new Input("chatInput", {
    width: "100%",
    placeholder: "Type your message here...",
  });

  // Send button: triggers LLM call or any other business logic
  const oSendButton = new Button({
    text: "Send",
    type: "Emphasized",
    press: () => {
      const sText = oUserInput.getValue();
      if (!sText) {
        MessageToast.show("Please enter a message.");
        return;
      }

      // 1. Add user message to the list (client-side)
      addMessageToList("User", sText, oMessageList, oController);

      // 2. Clear input
      oUserInput.setValue("");

      // 3. Call your LLM service or other logic (placeholder example)
      //    In a real implementation, you might do an async fetch here:
      //    const response = await callLLMService(sText);
      //    addMessageToList("AI", response, oMessageList, oController);

      // For demonstration, let's simulate a reply after a short delay:
      setTimeout(() => {
        const mockReply = "This is a mock reply from the AI.";
        addMessageToList("AI", mockReply, oMessageList, oController);
      }, 1000);
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
    horizontalScrolling: false,
    verticalScrolling: true,
    content: [oMessageList, oUserInputLayout],
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
  });

  // Add the dialog as a dependent of the view and open
  oView.addDependent(oChatDialog);
  oChatDialog.open();
}

/**
 * Helper function to create a single message item in the chat.
 */
function createMessageItem(sSender: string, sText: string): CustomListItem {
  const oSenderText = new Text(sSender) as unknown as Control;
  oSenderText.addStyleClass("sapUiSmallMarginBottom");

  const oMessageText = new Text(sText) as unknown as Control;
  oMessageText.addStyleClass("sapUiSmallMarginBottom");

  return new CustomListItem({
    content: new VBox({
      items: [oSenderText, oMessageText],
      width: "100%",
    }),
  });
}

/**
 * Helper function to add a message to the list and optionally persist it in the controller.
 */
function addMessageToList(
  sSender: string,
  sText: string,
  oMessageList: List,
  oController: any
) {
  // Push message to controller’s chat array (if you want to persist it)
  (oController._chatMessages = oController._chatMessages || []).push({
    sender: sSender,
    text: sText,
  });

  // Create a new list item
  const oNewItem = createMessageItem(sSender, sText);
  oMessageList.addItem(oNewItem);
}
