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
      const oView = (this as any).getView();
      // Replace with the correct ID for your GenerateReport button.
      const oButton = oView.byId(
        "sap.fe.cap.travel::TravelList--fe::table::Travel::LineItem::CustomAction::GenerateReport.controller"
      );

      if (oButton) {
        // Create a menu for the dropdown
        const oMenu = new Menu({
          items: [
            new MenuItem({
              text: "Settings",
              icon: "sap-icon://settings",
              press: (oEvent) => {
                // Implement your logic
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
          // Implement logic
          console.log(oEvent);
        });

        const oParent = oButton.getParent();

        // Replace the old Button with the new MenuButton
        oParent.setAggregation(
          "action",
          oMenuButton,
          /* bSuppressInvalidate = */ true
        );
      }
    },
  };
}
