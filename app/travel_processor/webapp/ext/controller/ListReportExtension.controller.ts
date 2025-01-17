import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import ExtensionAPI from "sap/fe/templates/ObjectPage/ExtensionAPI";
import URLWhitelist from "sap/base/security/URLWhitelist";

import Button from "sap/m/Button";

import {
  attachMenuButton,
  createFloatingChatButton,
} from "../utils/ButtonUtils";

/**
 * @namespace sap.fe.cap.travel.ext.controller
 * @controller
 */
export default class ListReportExtension extends ControllerExtension<ExtensionAPI> {
  private _oChatButton: Button | null = null; // Keep reference so we don't re-create

  static overrides = {
    onInit(this: ListReportExtension) {
      (this as any)._hyperparams = {
        tone: "neutral",
        maxTokens: 1000,
        temperature: 0.7,
      };
      (URLWhitelist as any).add("blob");
    },

    onAfterRendering(this: ExtensionAPI): void {
      const oView = (this as any).getView();

      // Call the helper function with the ID of the existing button to replace by the menub utton
      attachMenuButton(
        oView,
        "sap.fe.cap.travel::TravelList--fe::table::Travel::LineItem::CustomAction::GenerateReport.controller"
      );

      if (!(this as any)._oChatButton) {
        (this as any)._oChatButton = createFloatingChatButton(oView);
      }
    },
  };
}
