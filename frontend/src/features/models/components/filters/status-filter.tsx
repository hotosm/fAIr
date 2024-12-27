import { SEARCH_PARAMS } from "@/app/routes/models/models-list";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownMenuItem } from "@/components/ui/dropdown/dropdown";
import { CheckboxGroup } from "@/components/ui/form";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { TQueryParams } from "@/types";

type StatusFilterProps = {
  disabled: boolean;
  isMobileFilterModal?: boolean;
  updateQuery: (param: any) => void;
  query: TQueryParams;
};

const StatusFilter: React.FC<StatusFilterProps> = ({
  disabled,
  isMobileFilterModal = false,
  updateQuery,
  query,
}) => {
  const statusCategories: DropdownMenuItem[] = [
    {
      value: "All",
      apiValue: undefined,
      onClick() {
        updateQuery({
          [SEARCH_PARAMS.status]: undefined,
        });
      },
    },
    {
      value: "Published",
      apiValue: 0,
      onClick() {
        updateQuery({
          [SEARCH_PARAMS.status]: 0,
        });
      },
    },
    {
      value: "Draft",
      apiValue: -1,
      onClick() {
        updateQuery({
          [SEARCH_PARAMS.status]: -1,
        });
      },
    },
    {
      value: "Archived",
      apiValue: 1,
      onClick() {
        updateQuery({
          [SEARCH_PARAMS.status]: 1,
        });
      },
    },
  ];
  const categoryLabel = statusCategories.filter(
    (status) => status.apiValue === query[SEARCH_PARAMS.status],
  );

  const { dropdownIsOpened, onDropdownHide, onDropdownShow } =
    useDropdownMenu();

  if (!isMobileFilterModal) {
    return (
      <div className="hidden md:block border border-gray-border py-2 px-4">
        <DropDown
          menuItems={statusCategories}
          dropdownIsOpened={dropdownIsOpened}
          onDropdownHide={onDropdownHide}
          onDropdownShow={onDropdownShow}
          handleMenuSelection={() => null}
          disabled={disabled}
          defaultSelectedItem={categoryLabel[0]?.value}
          withCheckbox
          triggerComponent={
            <p className="text-sm text-dark text-nowrap">
              {categoryLabel[0]?.value}
            </p>
          }
        ></DropDown>
      </div>
    );
  }
  return (
    <CheckboxGroup
      options={statusCategories}
      disabled={disabled}
      onCheck={(status) => {
        updateQuery({
          [SEARCH_PARAMS.status]: status[0] !== "All" ? status[0] : undefined,
        });
      }}
      defaultSelectedOption={categoryLabel[0]?.apiValue as string}
    ></CheckboxGroup>
  );
};

export default StatusFilter;
