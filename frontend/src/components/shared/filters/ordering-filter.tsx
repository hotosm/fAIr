import { CheckboxGroup } from "@/components/ui/form";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownMenuItem } from "@/components/ui/dropdown/dropdown";
import { MODELS_CONTENT } from "@/constants";
import { SEARCH_PARAMS } from "@/app/routes/models/models-list";
import { TQueryParams } from "@/types";

export const ORDERING_FIELDS: DropdownMenuItem[] = [
  {
    value: "Oldest Created",
    apiValue: "created_at", // The actual filter from the backend. This is what is used to update the search params.
  },
  {
    value: "Newest Created",
    apiValue: "-created_at",
  },
  {
    value: "Oldest Updated",
    apiValue: "last_modified",
  },
  {
    value: "Newest Updated",
    apiValue: "-last_modified",
  },
];

type OrderingFilterProps = {
  updateQuery: (params: TQueryParams) => void;
  query: TQueryParams;
  disabled?: boolean;
  isMobileFilterModal?: boolean;
  className?: string;
};

export const OrderingFilter: React.FC<OrderingFilterProps> = ({
  disabled = false,
  query,
  updateQuery,
  isMobileFilterModal = false,
  className = "hidden md:block",
}) => {
  const onSortSelect = (selectedItem: string) => {
    updateQuery({
      [SEARCH_PARAMS.ordering]: ORDERING_FIELDS.find(
        (v) => v.value === selectedItem,
      )?.apiValue as string,
    });
  };

  if (!isMobileFilterModal) {
    return (
      <div className={className}>
        <DropDown
          menuItems={ORDERING_FIELDS}
          handleMenuSelection={onSortSelect}
          disabled={disabled}
          withCheckbox
          defaultSelectedItem={
            ORDERING_FIELDS.find(
              (v) => v.apiValue === query[SEARCH_PARAMS.ordering],
            )?.value
          }
          triggerComponent={
            <p className="text-xs md:text-sm text-dark text-nowrap">
              {
                MODELS_CONTENT.models.modelsList.sortingAndPaginationSection
                  .sortingTitle
              }
            </p>
          }
        ></DropDown>
      </div>
    );
  }

  return (
    <CheckboxGroup
      options={ORDERING_FIELDS}
      disabled={disabled}
      // @ts-expect-error bad type definition
      onCheck={onSortSelect}
      defaultSelectedOption={
        ORDERING_FIELDS.find(
          (v) => v.apiValue === query[SEARCH_PARAMS.ordering],
        )?.value
      }
    ></CheckboxGroup>
  );
};
