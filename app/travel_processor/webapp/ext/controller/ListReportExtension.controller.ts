import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import ExtensionAPI from "sap/fe/templates/ObjectPage/ExtensionAPI";
import Menu from "sap/m/Menu";
import MenuItem from "sap/m/MenuItem";
import MenuButton from "sap/m/MenuButton";

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
        },
      }),
    ],
  });

  // Create a new MenuButton which mimics the original button’s properties
  const oMenuButton = new MenuButton({
    text: oButton.getText(),
    menu: oMenu,
  });

  oMenuButton.attachEvent("press", (oEvent: any) => {
    // Implement logic for the press event
    console.log("MenuButton pressed:", oEvent);
  });

  // Replace the old Button with the new MenuButton
  const oParent = oButton.getParent();
  oParent.setAggregation(
    "action",
    oMenuButton,
    /* bSuppressInvalidate = */ true
  );
}
