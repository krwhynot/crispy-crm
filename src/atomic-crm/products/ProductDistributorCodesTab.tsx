import { TextInput } from "@/components/admin/text-input";

const DISTRIBUTOR_CODES = [
  { source: "usf_code", label: "US Foods Code" },
  { source: "sysco_code", label: "Sysco Code" },
  { source: "gfs_code", label: "GFS Code" },
  { source: "pfg_code", label: "PFG Code" },
  { source: "greco_code", label: "Greco Code" },
  { source: "gofo_code", label: "GOFO Code" },
  { source: "rdp_code", label: "RDP Code" },
  { source: "wilkens_code", label: "Wilkens Code" },
];

export const ProductDistributorCodesTab = () => (
  <div className="space-y-2">
    <p className="text-sm text-muted-foreground mb-4">
      Enter distributor-specific product codes (all optional).
    </p>
    <div className="grid grid-cols-2 gap-4">
      {DISTRIBUTOR_CODES.map(({ source, label }) => (
        <TextInput
          key={source}
          source={source}
          label={label}
          placeholder="Enter code..."
          helperText={false}
        />
      ))}
    </div>
  </div>
);
