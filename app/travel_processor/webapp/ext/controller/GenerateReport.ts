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
export async function generateReport(this: ExtensionAPI, pageContext: Context) {
  // Call the helper function and pass the confirmation logic
  const response = await getLLMResponse();
  console.log("LLM Response with fetch: ", response);
  /*openReportDialog(() => {
    // Logic to execute after user confirms in the dialog
    (this as any).editFlow
      .invokeAction("TravelService.generateReport", {
        contexts: (this as any).getSelectedContexts(),
        invocationGrouping: "ChangeSet",
      })
      .then(() => {
        // Show the editable dialog with the LLM output
        showEditableDialog(
          "Here will be the LLM output",
          (editedData: string) => {
            console.log("Edited Report Data:", editedData);

            // Optionally, handle the saved data here (e.g., update the backend)
            MessageToast.show("Report successfully generated and edited.");
          }
        );
      })
      .catch((err: any) => {
        console.error("Error invoking action", err);
        MessageToast.show("Failed to generate the report.");
      });
  });*/
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

function getBaseURL() {
  return window.location.protocol + "//" + window.location.host;
}

async function getLLMResponse() {
  const url =
    "http://localhost:4004/processor/Travel(TravelUUID='75757221AE84645C17020DF3754AB66',IsActiveEntity=true)/TravelService.generateReport";

  try {
    // 1) Construct the request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept:
          "application/json;odata.metadata=minimal;IEEE754Compatible=true",
        Prefer: "handling=strict",
        "Content-Type": "application/json;charset=UTF-8;IEEE754Compatible=true",
      },
      // 2) Body of the POST request (for actions with no input, empty object is fine)
      body: JSON.stringify({}),
    });

    // 3) Convert response to JSON
    const data = await response.json();

    console.log("OData action response:", data);
    // e.g. data.value => "It looks like your question is incomplete..."
  } catch (err) {
    console.error("Error calling generateReport:", err);
  }
}
