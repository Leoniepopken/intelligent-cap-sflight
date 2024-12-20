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
  // invoke action 'generateReport' of the TravelService, passing the context
  (this as any).editFlow
    .invokeAction("TravelService.generateReport", {
      contexts: (this as any).getSelectedContexts(),
      invocationGrouping: "ChangeSet",
    })
    .then((result: any) => console.log("Success", result))
    .catch((err: any) => console.error("Error invoking action", err));

  MessageToast.show("Custom handler invoked.");
}
