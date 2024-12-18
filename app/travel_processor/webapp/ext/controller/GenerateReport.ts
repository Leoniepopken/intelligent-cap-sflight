import ExtensionAPI from "sap/fe/core/ExtensionAPI";
import Context from "sap/ui/model/odata/v4/Context";
import MessageToast from "sap/m/MessageToast";

/**
 * Generated event handler.
 *
 * @param this reference to the 'this' that the event handler is bound to.
 * @param pageContext the context of the page on which the event was fired
 */
export function generateReport(this: ExtensionAPI, pageContext: Context) {
  // casting to 'any' such that ts doesn't complain about editFlow not existing
  const oModel = (this as any).editFlow.getView().getModel();
  // invoke action 'generateReport' of the TravelService, passing the model and context
  (this as any).editFlow
    .invokeAction("TravelService.generateReport", {
      //model: oModel,
      contexts: (this as any).getSelectedContexts(),
    })
    .then((result: any) => console.log("Success", result))
    .catch((err: any) => console.error("Error invoking action", err));

  MessageToast.show("Custom handler invoked.");
}
