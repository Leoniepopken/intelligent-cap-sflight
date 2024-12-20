import ExtensionAPI from "sap/fe/core/ExtensionAPI";
import Context from "sap/ui/model/odata/v4/Context";
import MessageToast from "sap/m/MessageToast";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import Text from "sap/m/Text";

/**
 * Generated event handler.
 *
 * @param this reference to the 'this' that the event handler is bound to.
 * @param pageContext the context of the page on which the event was fired
 */
export function generateReport(this: ExtensionAPI, pageContext: Context) {
  // Call the helper function and pass the confirmation logic
  openReportDialog(() => {
    // Logic to execute after user confirms in the dialog
    (this as any).editFlow
      .invokeAction("TravelService.generateReport", {
        contexts: (this as any).getSelectedContexts(),
        invocationGrouping: "ChangeSet",
      })
      .then((result: any) => console.log("Success", result))
      .catch((err: any) => console.error("Error invoking action", err));

    MessageToast.show("Custom handler invoked.");
  });
}

/**
 * Helper function to create and display a dialog.
 *
 * @param onConfirm Callback function to execute when the user confirms the action.
 */
function openReportDialog(onConfirm: () => void) {
  // Create the dialog
  const dialog = new Dialog({
    title: "Generate Report",
    content: new Text({
      text: "Do you want to generate a report?",
    }),
    beginButton: new Button({
      text: "Yes",
      press: () => {
        onConfirm();
        dialog.close();
      },
    }),
    endButton: new Button({
      text: "No",
      press: () => {
        dialog.close();
      },
    }),
    /**
     * Cleanup function that destroys the dialog instance after it is closed.
     * This ensures that resources are properly released and the dialog is
     * not retained in memory.
     */

    afterClose: () => {
      dialog.destroy();
    },
  });
  // Open the dialog
  dialog.open();
}
