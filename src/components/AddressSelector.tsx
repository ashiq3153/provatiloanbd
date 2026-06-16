import React, { useState, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import {
  divisions,
  districts,
  upazilas,
  getDistrictsByDivision,
  getUpazilasByDistrict,
} from "../lib/bdGeoData";

export interface AddressValue {
  division: string;
  district: string;
  upazila: string;
  union: string;
  village: string;
  postOffice: string;
  postCode: string;
}

interface AddressSelectorProps {
  label: string;
  value: AddressValue;
  onChange: (val: AddressValue) => void;
  isBn: boolean;
  errors?: Partial<Record<keyof AddressValue, string>>;
  prefix?: string; // for unique id
}

const selectClass = (hasError?: boolean) =>
  `w-full neu-input ${
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-transparent focus:border-primary-500/50"
  } rounded-xl px-3 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all appearance-none cursor-pointer`;

const inputClass = (hasError?: boolean) =>
  `w-full neu-input ${
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-transparent focus:border-primary-500/50"
  } rounded-xl px-3 py-2.5 text-xs text-gray-800 dark:text-white font-medium focus:ring-2 outline-none transition-all`;

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
    {children}
  </label>
);

const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    {children}
    <ChevronDown
      size={12}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
    />
  </div>
);

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  label,
  value,
  onChange,
  isBn,
  errors,
  prefix = "addr",
}) => {
  const [filteredDistricts, setFilteredDistricts] = useState(
    value.division ? getDistrictsByDivision(
      divisions.find(d => d.name === value.division || d.bn_name === value.division)?.id || ""
    ) : []
  );
  const [filteredUpazilas, setFilteredUpazilas] = useState(
    value.district ? getUpazilasByDistrict(
      districts.find(d => d.name === value.district || d.bn_name === value.district)?.id || ""
    ) : []
  );

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const divName = e.target.value;
    const div = divisions.find(d => (isBn ? d.bn_name : d.name) === divName);
    const newDistricts = div ? getDistrictsByDivision(div.id) : [];
    setFilteredDistricts(newDistricts);
    setFilteredUpazilas([]);
    onChange({ ...value, division: divName, district: "", upazila: "", union: "" });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distName = e.target.value;
    const dist = districts.find(d => (isBn ? d.bn_name : d.name) === distName);
    const newUpazilas = dist ? getUpazilasByDistrict(dist.id) : [];
    setFilteredUpazilas(newUpazilas);
    onChange({ ...value, district: distName, upazila: "", union: "" });
  };

  const handleUpazilaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, upazila: e.target.value, union: "" });
  };

  // Sync filtered lists when value changes externally (e.g., on edit load)
  useEffect(() => {
    if (value.division) {
      const div = divisions.find(
        d => d.bn_name === value.division || d.name === value.division
      );
      if (div) {
        const dists = getDistrictsByDivision(div.id);
        setFilteredDistricts(dists);
        if (value.district) {
          const dist = dists.find(
            d => d.bn_name === value.district || d.name === value.district
          );
          if (dist) {
            setFilteredUpazilas(getUpazilasByDistrict(dist.id));
          }
        }
      }
    }
  }, [value.division, value.district]);

  // Language auto-translation/correction
  useEffect(() => {
    let updated = false;
    const newValue = { ...value };

    if (value.division) {
      const div = divisions.find(d => d.name === value.division || d.bn_name === value.division);
      if (div) {
        const correctDivName = isBn ? div.bn_name : div.name;
        if (value.division !== correctDivName) {
          newValue.division = correctDivName;
          updated = true;
        }
      }
    }

    if (value.district) {
      const dist = districts.find(d => d.name === value.district || d.bn_name === value.district);
      if (dist) {
        const correctDistName = isBn ? dist.bn_name : dist.name;
        if (value.district !== correctDistName) {
          newValue.district = correctDistName;
          updated = true;
        }
      }
    }

    if (value.upazila) {
      const upz = upazilas.find(u => u.name === value.upazila || u.bn_name === value.upazila);
      if (upz) {
        const correctUpzName = isBn ? upz.bn_name : upz.name;
        if (value.upazila !== correctUpzName) {
          newValue.upazila = correctUpzName;
          updated = true;
        }
      }
    }

    if (updated) {
      onChange(newValue);
    }
  }, [isBn, value.division, value.district, value.upazila, onChange]);

  const t = (en: string, bn: string) => (isBn ? bn : en);

  return (
    <div className="rounded-2xl border border-white/20 dark:border-white/5 bg-gray-50/50 dark:bg-gray-900/20 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/40 dark:bg-gray-800/30 border-b border-gray-200/50 dark:border-gray-850/50">
        <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <MapPin size={14} className="text-primary-600 dark:text-primary-400" />
        </div>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{label}</span>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Row 1: Division + District */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>{t("Division", "বিভাগ")}</FieldLabel>
            <SelectWrapper>
              <select
                id={`${prefix}-division`}
                value={value.division}
                onChange={handleDivisionChange}
                className={selectClass(!!errors?.division)}
              >
                <option value="">{t("Select Division", "বিভাগ বেছে নিন")}</option>
                {divisions.map(d => (
                  <option key={d.id} value={isBn ? d.bn_name : d.name}>
                    {isBn ? d.bn_name : d.name}
                  </option>
                ))}
              </select>
            </SelectWrapper>
            {errors?.division && (
              <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.division}</p>
            )}
          </div>

          <div>
            <FieldLabel>{t("District", "জেলা")}</FieldLabel>
            <SelectWrapper>
              <select
                id={`${prefix}-district`}
                value={value.district}
                onChange={handleDistrictChange}
                disabled={!value.division}
                className={selectClass(!!errors?.district) + ((!value.division) ? " opacity-50 cursor-not-allowed" : "")}
              >
                <option value="">{t("Select District", "জেলা বেছে নিন")}</option>
                {filteredDistricts.map(d => (
                  <option key={d.id} value={isBn ? d.bn_name : d.name}>
                    {isBn ? d.bn_name : d.name}
                  </option>
                ))}
              </select>
            </SelectWrapper>
            {errors?.district && (
              <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.district}</p>
            )}
          </div>
        </div>

        {/* Row 2: Upazila + Union */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>{t("Upazila/Thana", "উপজেলা/থানা")}</FieldLabel>
            <SelectWrapper>
              <select
                id={`${prefix}-upazila`}
                value={value.upazila}
                onChange={handleUpazilaChange}
                disabled={!value.district}
                className={selectClass(!!errors?.upazila) + ((!value.district) ? " opacity-50 cursor-not-allowed" : "")}
              >
                <option value="">{t("Select Upazila", "উপজেলা বেছে নিন")}</option>
                {filteredUpazilas.map(u => (
                  <option key={u.id} value={isBn ? u.bn_name : u.name}>
                    {isBn ? u.bn_name : u.name}
                  </option>
                ))}
              </select>
            </SelectWrapper>
            {errors?.upazila && (
              <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.upazila}</p>
            )}
          </div>

          <div>
            <FieldLabel>{t("Union/Municipality", "ইউনিয়ন/পৌরসভা")}</FieldLabel>
            <input
              id={`${prefix}-union`}
              type="text"
              value={value.union}
              onChange={e => onChange({ ...value, union: e.target.value })}
              placeholder={t("Union/Pourashava", "ইউনিয়ন বা পৌরসভা")}
              className={inputClass(!!errors?.union)}
            />
            {errors?.union && (
              <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.union}</p>
            )}
          </div>
        </div>

        {/* Row 3: Village */}
        <div>
          <FieldLabel>{t("Village/Area", "গ্রাম/মহল্লা")}</FieldLabel>
          <input
            id={`${prefix}-village`}
            type="text"
            value={value.village}
            onChange={e => onChange({ ...value, village: e.target.value })}
            placeholder={t("Village or Mohalla name", "গ্রাম বা মহল্লার নাম")}
            className={inputClass(!!errors?.village)}
          />
          {errors?.village && (
            <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.village}</p>
          )}
        </div>

        {/* Row 4: Post Office + Post Code */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>{t("Post Office", "পোস্ট অফিস")}</FieldLabel>
            <input
              id={`${prefix}-postOffice`}
              type="text"
              value={value.postOffice}
              onChange={e => onChange({ ...value, postOffice: e.target.value })}
              placeholder={t("Post Office name", "পোস্ট অফিসের নাম")}
              className={inputClass(!!errors?.postOffice)}
            />
            {errors?.postOffice && (
              <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.postOffice}</p>
            )}
          </div>
          <div>
            <FieldLabel>{t("Post Code", "পোস্ট কোড")}</FieldLabel>
            <input
              id={`${prefix}-postCode`}
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={value.postCode}
              onChange={e => onChange({ ...value, postCode: e.target.value.replace(/\D/g, "") })}
              placeholder="e.g. 1000"
              className={inputClass(!!errors?.postCode)}
            />
            {errors?.postCode && (
              <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.postCode}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper: serialize AddressValue to a single string for DB storage
export function serializeAddress(addr: AddressValue): string {
  const parts = [
    addr.village,
    addr.union,
    addr.postOffice ? `P.O. ${addr.postOffice}` : "",
    addr.upazila,
    addr.district,
    addr.division,
    addr.postCode ? `- ${addr.postCode}` : "",
  ].filter(Boolean);
  return parts.join(", ");
}

// Helper: create empty AddressValue
export function emptyAddress(): AddressValue {
  return {
    division: "",
    district: "",
    upazila: "",
    union: "",
    village: "",
    postOffice: "",
    postCode: "",
  };
}
