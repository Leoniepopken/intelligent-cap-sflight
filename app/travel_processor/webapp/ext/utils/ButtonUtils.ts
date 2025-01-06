import Button from "sap/m/Button";
import Menu from "sap/m/Menu";
import MenuItem from "sap/m/MenuItem";
import { openHyperparametersDialog } from "./DialogUtils";
import MenuButton from "sap/m/MenuButton";
import { invokeGenerateReportAction } from "./GenerateReportUtils";
import { openChatDialog } from "./DialogUtils";

export function createFloatingChatButton(oView: any): Button {
  // Create the button
  const oChatButton = new Button({
    icon: "sap-icon://discussion",
    tooltip: "Open Chat",
    press: () => openChatDialog(oView),
  });

  // "placeAt" can place the button at the root of the HTML body (content), or a container
  oChatButton.placeAt("floatingContainer");

  return oChatButton;
}

/**
 * Helper function to attach a MenuButton in place of an existing Button.
 *
 * @param {sap.ui.core.mvc.View} oView - The current view.
 * @param {string} sButtonId - The ID of the button to be replaced.
 */
export function attachMenuButton(oView: any, sButtonId: string): void {
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
    menu: oMenu.addStyleClass("customMenu"),
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
