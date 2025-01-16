import Button from "sap/m/Button";
import Menu from "sap/m/Menu";
import MenuItem from "sap/m/MenuItem";
import MenuButton from "sap/m/MenuButton";
import { performTask } from "./LLMUtils";
import {
  openChatDialog,
  confirmReportDialog,
  handleGeneratedReport,
  openHyperparametersDialog,
} from "./DialogUtils";

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

  const template = `You are a travel planner. Tone: {{?tone}}
              Generate a report based on the following content: {{?content}}. 
              An travel status of X means canceled, A means accepted, B means booked.
              The report should be of the following form:
              - The total number of travels
              - The total number of accepted travels
              - The total number of canceled travels
              - The total number of rejected travels
              `;

  const systemRole = "You are a travel planner";

  // Create a new MenuButton which mimics the original button’s properties
  const oMenuButton = new MenuButton({
    text: oButton.getText(),
    menu: oMenu.addStyleClass("customMenu"),
    buttonMode: "Split",
    useDefaultActionOnly: true,
    defaultAction: async () => {
      const { confirmed, selectedFormats } = await confirmReportDialog(oView);
      if (confirmed) {
        const collectedContent = JSON.stringify(collectSelectedContent(oView));

        // Concatenate content and formats
        const concatenatedContent = `${collectedContent}\nSelected Formats: ${selectedFormats.join(
          ", "
        )}`;

        console.log(concatenatedContent);

        const response = await performTask(
          oView,
          template,
          systemRole,
          concatenatedContent,
          "gpt-35-turbo" // Pass formats here
        );
        handleGeneratedReport(response);
      }
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

/**
 * Helper function to collect and filter the selected content.
 */
function collectSelectedContent(oView: any) {
  const oController = oView.getController();
  const oEditFlow = oController.editFlow;

  const contextsSelected = oEditFlow
    .getView()
    .byId(
      "sap.fe.cap.travel::TravelList--fe::table::Travel::LineItem-innerTable"
    )
    .getSelectedContexts();

  const unfilteredContent = contextsSelected.map((context: any) =>
    context.getObject()
  );

  // Filter fields for each object in the array
  const filteredContent = unfilteredContent.map((item: any) => ({
    BeginDate: item.BeginDate,
    BookingFee: item.BookingFee,
    EndDate: item.EndDate,
    Description: item.Description,
    TravelStatus: item.TravelStatus,
    TotalPrice: item.TotalPrice,
    to_Agency: item.to_Agency?.Name,
    to_Customer: item.to_Customer?.LastName,
  }));

  return filteredContent;
}
