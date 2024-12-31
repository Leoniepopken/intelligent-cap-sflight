import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import ExtensionAPI from "sap/fe/templates/ObjectPage/ExtensionAPI";

import Menu from "sap/m/Menu";
import MenuItem from "sap/m/MenuItem";
import MenuButton from "sap/m/MenuButton";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import Input from "sap/m/Input";
import StepInput from "sap/m/StepInput";
import Slider from "sap/m/Slider";
import MessageToast from "sap/m/MessageToast";
import TextArea from "sap/m/TextArea";
import { get } from "@sap/cds";

/**
 * @namespace sap.fe.cap.travel.ext.controller
 * @controller
 */
export default class ListReportExtension extends ControllerExtension<ExtensionAPI> {
  static overrides = {
    onInit(this: ListReportExtension) {
      (this as any)._hyperparams = {
        tone: "neutral",
        maxTokens: 1000,
        temperature: 0.7,
      };
    },

    onAfterRendering(this: ExtensionAPI): void {
      // Retrieve the view
      const oView = (this as any).getView();

      // Call the helper function with the ID of the existing button to replace
      attachMenuButton(
        oView,
        "sap.fe.cap.travel::TravelList--fe::table::Travel::LineItem::CustomAction::GenerateReport.controller"
      );
    },
  };
}

/**
 * Helper function to attach a MenuButton in place of an existing Button.
 *
 * @param {sap.ui.core.mvc.View} oView - The current view.
 * @param {string} sButtonId - The ID of the button to be replaced.
 */
function attachMenuButton(oView: any, sButtonId: string): void {
  const oButton = oView.byId(sButtonId);
  if (!oButton) {
    return;
  }

  // Create a menu for the dropdown
  const oMenu = new Menu({
    items: [
      new MenuItem({
        text: "Configure AI hyperparameters",
        icon: "sap-icon://settings",
        press: async () => {
          console.log("Extra Option 1 clicked.");
          openHyperparametersDialog(oView);
        },
      }),
    ],
  });

  // Create a new MenuButton which mimics the original button’s properties
  const oMenuButton = new MenuButton({
    text: oButton.getText(),
    menu: oMenu,
    buttonMode: "Split",
    useDefaultActionOnly: true,
    defaultAction: () => {
      console.log("MenuButton default action triggered!");
      invokeGenerateReportAction(oView);
    },
  });

  // Replace the old Button with the new MenuButton
  const oParent = oButton.getParent();
  oParent.setAggregation(
    "action",
    oMenuButton,
    /* bSuppressInvalidate = */ true
  );
}

/**
 * Helper function to open a Dialog (overlay) for configuring LLM hyperparameters.
 */
function openHyperparametersDialog(oView: any): void {
  const oController = oView.getController();
  const hyperparams = (oController as any)._hyperparams || {
    tone: "",
    maxTokens: 1000,
    temperature: 0.7,
  };
  const oDialog = new Dialog({
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
        design: "Bold",
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
        press: function () {
          // Gather user inputs from the dialog
          const sTone = (
            sap.ui.getCore().byId("toneInput") as Input
          ).getValue();
          const iTokens = (
            sap.ui.getCore().byId("tokenStepInput") as StepInput
          ).getValue();
          const fTemperature = (
            sap.ui.getCore().byId("temperatureSlider") as Slider
          ).getValue();

          // Store hyperparameters on view controller
          const oController = oView.getController();
          (oController as any)._hyperparams = {
            tone: sTone,
            maxTokens: iTokens,
            temperature: fTemperature,
          };

          // Close the dialog
          oDialog.close();
        },
      }),
      new Button({
        text: "Cancel",
        press: function () {
          oDialog.close();
        },
      }),
    ],
    afterClose: function () {
      oDialog.destroy();
    },
  });

  // Add dialog as a dependent to the view (so it gets destroyed with the view)
  oView.addDependent(oDialog);

  // Finally, open the dialog
  oDialog.open();
}

async function invokeGenerateReportAction(oView: any): Promise<void> {
  try {
    // 1) Ask for confirmation
    await confirmReportDialog(oView);

    // 2) Only if user confirmed, invoke the report action
    const oController = oView.getController();
    const oEditFlow = oController.getExtensionAPI().editFlow;

    // Retrieve any stored hyperparameters (if they exist)
    const hyperparams = (oController as any)._hyperparams || {};
    const sTone = hyperparams.tone || "";
    const iTokens = hyperparams.maxTokens || 500;
    const fTemperature = hyperparams.temperature || 0.1;

    const response = await oEditFlow.invokeAction(
      "TravelService.EntityContainer/generateReport",
      {
        model: oEditFlow.getView().getModel(),
        parameterValues: [
          {
            name: "content",
            value: JSON.stringify(collectSelectedContent(oView)),
          },
          {
            name: "tone",
            value: sTone,
          },
          {
            name: "maxTokens",
            value: iTokens,
          },
          {
            name: "temperature",
            value: fTemperature,
          },
        ],
        skipParameterDialog: true,
      }
    );

    console.log("Generated report:", response.value);

    // 3) Open your 'handleGeneratedReport' dialog afterwards
    handleGeneratedReport(response.value);

    return response.value;
  } catch (err) {
    // This 'catch' is triggered if the user pressed "No" (rejected the promise),
    // or if an error happened in the code above
    console.log("User canceled or an error occurred:", err);
  }
}

function confirmReportDialog(oView: any): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Create the dialog
    const oDialog = new Dialog({
      title: "Confirm Report",
      content: [
        new Label({ text: "Are you sure you want to confirm this report?" }),
      ],
      buttons: [
        new Button({
          text: "Yes",
          press: function () {
            resolve(); // Resolve the promise if user confirms
            oDialog.close();
          },
        }),
        new Button({
          text: "No",
          press: function () {
            reject(); // Reject if user cancels
            oDialog.close();
          },
        }),
      ],
      afterClose: function () {
        oDialog.destroy();
      },
    });

    // Add dialog as a dependent to the view
    oView.addDependent(oDialog);

    // Open the dialog
    oDialog.open();
  });
}

function handleGeneratedReport(response: any): void {
  // Create the TextArea
  const textArea = new TextArea({
    value: response,
    width: "100%",
    rows: 10,
  });

  let dialog: Dialog;

  // Create the dialog
  dialog = new Dialog({
    title: "Edit Report",
    content: [textArea],
    beginButton: new Button({
      text: "Save",
      press: () => {
        const editedData = dialog.data("editedData") || response;
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

  // Attach liveChange AFTER the dialog is declared
  textArea.attachLiveChange((event) => {
    const textArea = event.getSource() as TextArea;
    dialog.data("editedData", textArea.getValue());
  });

  dialog.open();
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
