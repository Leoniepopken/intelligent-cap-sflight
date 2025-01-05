// DialogUtils.ts

import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import Input from "sap/m/Input";
import StepInput from "sap/m/StepInput";
import Slider from "sap/m/Slider";
import Button from "sap/m/Button";
import TextArea from "sap/m/TextArea";
import MessageToast from "sap/m/MessageToast";

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
  });

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
        new Label({ text: "Are you sure you want to confirm this report?" }),
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
    });

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

  textArea.attachLiveChange((event) => {
    const area = event.getSource() as TextArea;
    dialog.data("editedData", area.getValue());
  });

  dialog.open();
}
