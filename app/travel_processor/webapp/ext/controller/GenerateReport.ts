import ExtensionAPI from "sap/fe/core/ExtensionAPI";
import Context from "sap/ui/model/odata/v4/Context";
import MessageToast from "sap/m/MessageToast";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import Text from "sap/m/Text";
import TextArea from "sap/m/TextArea";

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
      .then((result: any) => {
        // Extract the output from the result
        const llmOutput = result?.output || "No output generated";

        // Show the editable dialog with the LLM output
        showEditableDialog(llmOutput, (editedData: string) => {
          console.log("Edited Report Data:", editedData);

          // Optionally, handle the saved data here (e.g., update the backend)
          MessageToast.show("Report successfully generated and edited.");
        });
      })
      .catch((err: any) => {
        console.error("Error invoking action", err);
        MessageToast.show("Failed to generate the report.");
      });
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
      text: "Do you want to generate a report? Please note that this action includes a LLM call. Please review the generated report",
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

/**
 * Helper function to create and display an editable dialog.
 *
 * @param llmOutput The initial text output from the LLM.
 * @param onSave Callback function to execute when the user saves the edited data.
 */
function showEditableDialog(
  llmOutput: string,
  onSave: (editedData: string) => void
) {
  const dialog: any = new Dialog({
    title: "Edit Report",
    content: new TextArea({
      value: llmOutput,
      width: "100%",
      rows: 10,
      liveChange: (event) => {
        const textArea = event.getSource() as TextArea;
        dialog.data("editedData", textArea.getValue());
      },
    }),
    beginButton: new Button({
      text: "Save",
      press: () => {
        const editedData = dialog.data("editedData") || llmOutput;
        dialog.close();
        onSave(editedData);
      },
    }),
    endButton: new Button({
      text: "Cancel",
      press: () => dialog.close(),
    }),
    afterClose: () => dialog.destroy(),
  });

  dialog.open();
}
