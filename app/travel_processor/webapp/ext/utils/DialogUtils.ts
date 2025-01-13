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
import { performTask } from "./LLMUtils";
import JSONModel from "sap/ui/model/json/JSONModel";
import List from "sap/m/List";
import ScrollContainer from "sap/m/ScrollContainer";
import HBox from "sap/m/HBox";
import CustomListItem from "sap/m/CustomListItem";
import FormattedText from "sap/m/FormattedText";
import FlexItemData from "sap/m/FlexItemData";

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

  // Initialize JSON model with existing messages
  const oModel = new JSONModel({
    messages: aMessages,
  });

  // Create a List to display messages
  const oMessageList = new List({
    items: {
      path: "/messages",
      template: new CustomListItem({
        content: [
          new VBox({
            items: [
              new Label({
                text: "{sender}",
              }).addStyleClass("sapUiSmallMarginTop"),
              new FormattedText({
                htmlText: "{text}",
              }).addStyleClass("sapUiSmallMarginTopBottom"),
              new HBox({
                items: [
                  new Button({
                    icon: "sap-icon://thumb-up",
                    visible: "{= ${sender} === 'AI' }", // only show for AI
                  }).addStyleClass(
                    "sapUiTinyMarginBeginEnd sapUiTinyMarginBottom"
                  ),
                  new Button({
                    icon: "sap-icon://thumb-down",
                    visible: "{= ${sender} === 'AI' }",
                  }).addStyleClass(
                    "sapUiTinyMarginBeginEnd sapUiTinyMarginBottom"
                  ),
                ],
              }).addStyleClass("sapUiTinyMarginTop"),
            ],
          }),
        ],
      }),
    },
    // Make the list scrollable
    inset: false,
  });

  // Bind the model to the List
  oMessageList.setModel(oModel);

  // Create a ScrollContainer to hold the message list
  const oScrollContainer = new ScrollContainer({
    content: [oMessageList],
    vertical: true,
    horizontal: false,
    layoutData: new FlexItemData({ growFactor: 1 }),
  }).addStyleClass("sapUiSmallMarginBottom");

  // Function to scroll to the bottom of the ScrollContainer
  const scrollToBottom = () => {
    // Get the DOM reference of the ScrollContainer
    const oDomRef = oScrollContainer.getDomRef();
    if (oDomRef) {
      // The ScrollContainer may contain a scrollable div inside
      // Find the scrollable div and set its scrollTop
      const oScrollableDiv = oDomRef.querySelector(".sapMScrCont");
      if (oScrollableDiv) {
        oScrollableDiv.scrollTop = oScrollableDiv.scrollHeight;
      }
    }
  };

  // Initial scroll to bottom in case there are pre-existing messages
  oScrollContainer.attachBrowserEvent("onAfterRendering", scrollToBottom);

  // A simple Input field where the user can type a new message
  const oUserInput = new Input("chatInput", {
    width: "100%",
    placeholder: "Type your message here...",
    layoutData: new FlexItemData({ growFactor: 0.9 }),
  });

  // Send button: triggers LLM call
  const oSendButton = new Button({
    text: "Send",
    type: "Emphasized",
    press: async () => {
      const sText = oUserInput.getValue().trim();
      if (!sText) {
        MessageToast.show("Please enter a message.");
        return;
      }

      // 1. Add user message to the list (client-side)
      aMessages.push({
        sender: "You",
        text: sText,
      });
      oModel.refresh(); // Update the model to reflect changes

      // Scroll to the bottom to show the latest message
      scrollToBottom();

      // 2. Clear input
      oUserInput.setValue("");

      try {
        // 3. Call LLM service
        const systemRole = "You are a helpful assistant";
        const template = `You are given the following content: {{?content}}. Respond using this tone: {{?tone}}.
          
          "Certainly! Here is the data you requested:"
          You may answer with variants of this sentence.
          `;

        // TODO: include other aswer options.

        const sResponse = await performTask(oView, template, systemRole, sText);

        console.log("Response:", sResponse);

        // 4. Add LLM response to the list
        aMessages.push({
          sender: "AI",
          text: sResponse,
        });
        oModel.refresh(); // Update the model to reflect changes

        // Scroll to the bottom to show the latest message
        scrollToBottom();
      } catch (error) {
        MessageToast.show("Failed to get response from AI.");
        console.error(error);
      }
    },
  });

  // Put the Input and Send button on a single line
  const oUserInputLayout = new HBox({
    items: [oUserInput, oSendButton],
    alignItems: "Center",
    justifyContent: "SpaceBetween",
    width: "100%",
  }).addStyleClass("sapUiSmallMarginTop sapUiTinyMarginBottom");

  // Create the dialog
  const oChatDialog: Dialog = new Dialog({
    title: "AI Chat",
    contentWidth: "500px",
    contentHeight: "500px",
    horizontalScrolling: false,
    verticalScrolling: false, // Managed by ScrollContainer
    content: [
      new VBox({
        items: [oScrollContainer, oUserInputLayout],
        height: "100%",
        renderType: "Bare",
      }),
    ],
    buttons: [
      new Button({
        text: "Close",
        press: () => oChatDialog.close(),
      }),
    ],
    afterClose: () => {
      oChatDialog.destroy();
    },
  }).addStyleClass("sapUiContentPadding");

  // Add the dialog as a dependent of the view and open
  oView.addDependent(oChatDialog);
  oChatDialog.open();
}
