import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import ExtensionAPI from "sap/fe/templates/ObjectPage/ExtensionAPI";

/**
 * @namespace sap.fe.cap.travel.ext.controller
 * @controller
 */
export default class ListReportExtension extends ControllerExtension<ExtensionAPI> {
  static overrides = {
    onInit(this: ListReportExtension) {
      console.log("ListReportExtension onInit called.");
    },
  };
}
