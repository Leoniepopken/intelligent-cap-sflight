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

/**
 * @namespace sap.fe.cap.travel.ext.controller
 * @controller
 */
export default class ListReportExtension extends ControllerExtension<ExtensionAPI> {
  static overrides = {
    onInit(this: ListReportExtension) {
      console.log("ListReportExtension onInit called.");
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
        press: () => {
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
  // Create the dialog content dynamically.
  // In real-world scenarios, you might use a fragment to handle complex UIs.

  const oDialog = new Dialog({
    title: "Configure AI Hyperparameters",
    contentWidth: "400px",
    content: [
      new Label({ text: "Tone", labelFor: "toneInput", width: "100%" }),
      new Input("toneInput", {
        placeholder: "e.g. friendly, formal, creative...",
        width: "100%",
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
        value: 1000,
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
        value: 0.7,
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

          // Here you could do something with these values, e.g., store them in a model,
          // pass them to a backend, or just log them:
          console.log("Tone:", sTone);
          console.log("Max Tokens:", iTokens);
          console.log("Temperature:", fTemperature);

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
  const oController = oView.getController();
  const oEditFlow = oController.getExtensionAPI().editFlow;

  const response = await oEditFlow.invokeAction(
    "TravelService.EntityContainer/generateReport",
    {
      model: oEditFlow.getView().getModel(),
      parameterValues: [
        {
          name: "content",
          value: JSON.stringify("Hello world!"),
        },
      ],
      skipParameterDialog: true,
    }
  );

  console.log("Generated report:", response.value);
  return response.value;
}
