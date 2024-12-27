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
 */
export async function generateReport(this: ExtensionAPI) {
  const oEditFlow = (this as any).editFlow;

  const travelIDs = collectSelectedRows(this);

  try {
    // Wait for user confirmation (or cancellation)
    await confirmReportDialog();

    // Invoke the backend action
    const response = oEditFlow.invokeAction(
      "TravelService.EntityContainer/generateReport",
      {
        model: oEditFlow.getView().getModel(),
        parameterValues: travelIDs,
        skipParameterDialog: true,
      }
    );

    // Handle the response (show an editable dialog to the user)
    handleGeneratedReport(response);
  } catch (err) {
    // If the user cancelled or any error occurred, handle it here
    MessageToast.show("Failed to generate the report.");
  }
}

function confirmReportDialog(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Create the dialog
    const dialog = new Dialog({
      title: "Generate Report",
      content: new Text({
        text: "Do you want to generate a report? Please note that this action includes a LLM call. Please review the generated report",
      }),
      beginButton: new Button({
        text: "Yes",
        press: () => {
          resolve();
          dialog.close();
        },
      }),
      endButton: new Button({
        text: "No",
        press: () => {
          reject(new Error("User cancelled generation"));
          dialog.close();
        },
      }),
      afterClose: () => {
        dialog.destroy();
      },
    });

    // Open the dialog
    dialog.open();
  });
}

function handleGeneratedReport(response: any): void {
  const generatedContent = response[0].value.getValue().value;

  // Create the TextArea
  const textArea = new TextArea({
    value: generatedContent,
    width: "100%",
    rows: 10,
  });

  let dialog: Dialog;

  // Create the dialog
  dialog = new Dialog({
    title: "Edit Report",
    content: [textArea],
    beginButton: new Button({
      text: "Save",
      press: () => {
        const editedData = dialog.data("editedData") || generatedContent;
        dialog.close();
        MessageToast.show("Report successfully generated and edited.");
      },
    }),
    endButton: new Button({
      text: "Cancel",
      press: () => dialog.close(),
    }),
    afterClose: () => dialog.destroy(),
  });

  // Attach liveChange AFTER the dialog is declared
  textArea.attachLiveChange((event) => {
    const textArea = event.getSource() as TextArea;
    dialog.data("editedData", textArea.getValue());
  });

  dialog.open();
}

function collectSelectedRows(api: ExtensionAPI): string[] {
  const oEditFlow = (api as any).editFlow;
  const oModel = oEditFlow.getView().getModel();

  const contextsSelected = oEditFlow
    .getView()
    .byId(
      "sap.fe.cap.travel::TravelList--fe::table::Travel::LineItem-innerTable"
    )
    .getSelectedContexts();

  const travelIDs = contextsSelected.map(
    (context: any) => context.getObject().TravelUUID
  );

  return travelIDs;
}
