import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { sortCategoriesByPreferredSequence } from "@/utils/category-order";

export type VehicleFilters = {
  fuelType: string[];
  transmission: string[];
  bodyType: string[];
  ownership: string[];
};

export type ListingCategory = {
  cat_id: string;
  cat_name: string;
};

type FilterChipOption = {
  label: string;
  value: string;
};

type FilterSection = {
  key: keyof VehicleFilters;
  title: string;
  options: FilterChipOption[];
};

const FILTER_SECTIONS: FilterSection[] = [
  {
    key: "fuelType",
    title: "FUEL TYPE",
    options: [
      { label: "Petrol", value: "PETROL" },
      { label: "Diesel", value: "DIESEL" },
      { label: "CNG", value: "CNG" },
      { label: "Electric", value: "ELECTRIC" },
    ],
  },
  {
    key: "transmission",
    title: "TRANSMISSION",
    options: [
      { label: "Manual", value: "MANUAL" },
      { label: "Automatic", value: "AUTOMATIC" },
    ],
  },
  {
    key: "bodyType",
    title: "BODY TYPE",
    options: [
      { label: "Sedan", value: "SEDAN" },
      { label: "MUV", value: "MUV" },
      { label: "SUV", value: "SUV" },
      { label: "Luxury", value: "LUXURY" },
      { label: "Hatchback", value: "HATCHBACK" },
    ],
  },
  {
    key: "ownership",
    title: "OWNERSHIP",
    options: [
      { label: "1st Owner", value: "FIRST_OWNER" },
      { label: "2nd Owner", value: "SECOND_OWNER" },
      { label: "3rd Owner", value: "THIRD_OWNER" },
      { label: "4th+ Owner", value: "FOURTH_OWNER_PLUS" },
    ],
  },
];

function toggleValue(list: string[], value: string): string[] {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }
  return [...list, value];
}

type ListingSearchFiltersProps = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  heroColor?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: ListingCategory[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  appliedFilters: VehicleFilters;
  onApplyFilters: (filters: VehicleFilters) => void;
};

export function ListingSearchFilters({
  title,
  subtitle,
  searchPlaceholder,
  heroColor = "#dc2626",
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategorySelect,
  appliedFilters,
  onApplyFilters,
}: ListingSearchFiltersProps) {
  const [filterVisible, setFilterVisible] = useState(false);
  const [draftFilters, setDraftFilters] = useState<VehicleFilters>(appliedFilters);
  const orderedCategories = useMemo(
    () => sortCategoriesByPreferredSequence(categories),
    [categories],
  );

  const activeFilterCount = useMemo(
    () =>
      appliedFilters.fuelType.length +
      appliedFilters.transmission.length +
      appliedFilters.bodyType.length +
      appliedFilters.ownership.length,
    [appliedFilters],
  );

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setFilterVisible(true);
  };

  const closeFilters = () => {
    setFilterVisible(false);
  };

  const resetDraftFilters = () => {
    setDraftFilters({ fuelType: [], transmission: [], bodyType: [], ownership: [] });
  };

  const applyDraftFilters = () => {
    onApplyFilters(draftFilters);
    closeFilters();
  };

  return (
    <>
      <View style={[styles.heroBanner, { backgroundColor: heroColor }]}>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.85)" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder={searchPlaceholder}
              placeholderTextColor="rgba(255,255,255,0.75)"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => onSearchChange("")}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.8)" />
              </Pressable>
            )}
          </View>

          <Pressable onPress={openFilters} style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color="#fff" />
            {activeFilterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.categoriesWrap}>
        <Text style={styles.categoriesTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          <Pressable
            onPress={() => onCategorySelect("all")}
            style={[styles.categoryChip, selectedCategory === "all" && styles.categoryChipActive]}
          >
            <Text style={[styles.categoryChipText, selectedCategory === "all" && styles.categoryChipTextActive]}>All</Text>
          </Pressable>
          {orderedCategories.map((category) => (
            <Pressable
              key={category.cat_id}
              onPress={() => onCategorySelect(category.cat_id)}
              style={[styles.categoryChip, selectedCategory === category.cat_id && styles.categoryChipActive]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category.cat_id && styles.categoryChipTextActive,
                ]}
              >
                {category.cat_name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Modal visible={filterVisible} animationType="slide" transparent onRequestClose={closeFilters}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <Pressable onPress={resetDraftFilters}>
                <Text style={styles.resetText}>RESET ALL</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {FILTER_SECTIONS.map((section) => (
                <View key={section.key} style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>{section.title}</Text>
                  <View style={styles.filterOptionsWrap}>
                    {section.options.map((option) => {
                      const isSelected = draftFilters[section.key].includes(option.value);

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => {
                            setDraftFilters((prev) => ({
                              ...prev,
                              [section.key]: toggleValue(prev[section.key], option.value),
                            }));
                          }}
                          style={[styles.filterChip, isSelected && styles.filterChipActive]}
                        >
                          <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable onPress={closeFilters} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={applyDraftFilters} style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    marginHorizontal: 16,
    backgroundColor: "#dc2626",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 10,
    shadowColor: "#7f1d1d",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTitle: { fontSize: 40 / 2, fontFamily: "Urbanist_700Bold", color: "#fff" },
  heroSubtitle: { fontSize: 15, fontFamily: "Urbanist_400Regular", color: "rgba(255,255,255,0.9)" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: "#fff",
    fontFamily: "Urbanist_500Medium",
    padding: 0,
  },
  filterBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
  },
  badgeText: { fontSize: 11, fontFamily: "Urbanist_700Bold", color: "#fff" },

  categoriesWrap: { marginTop: 18, marginBottom: 8 },
  categoriesTitle: {
    fontSize: 34 / 2,
    fontFamily: "Urbanist_700Bold",
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categoryRow: { paddingHorizontal: 16, gap: 10 },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  categoryChipActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  categoryChipText: { fontSize: 16 / 1.15, fontFamily: "Urbanist_600SemiBold", color: Colors.textSecondary },
  categoryChipTextActive: { color: "#fff" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "88%",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  modalTitle: { fontSize: 36 / 2, fontFamily: "Urbanist_700Bold", color: "#0f172a" },
  resetText: {
    fontSize: 14,
    fontFamily: "Urbanist_700Bold",
    color: "#2563eb",
    letterSpacing: 1,
  },
  modalBody: { paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  filterSection: { marginTop: 22 },
  filterSectionTitle: {
    fontSize: 12,
    fontFamily: "Urbanist_700Bold",
    letterSpacing: 2,
    color: "#94a3b8",
    marginBottom: 12,
  },
  filterOptionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbe2ea",
    backgroundColor: "#f8fafc",
  },
  filterChipActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  filterChipText: { fontSize: 14, fontFamily: "Urbanist_600SemiBold", color: "#64748b" },
  filterChipTextActive: { color: "#1d4ed8" },

  modalActions: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  cancelBtnText: { fontSize: 16, fontFamily: "Urbanist_600SemiBold", color: "#334155" },
  applyBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
  },
  applyBtnText: { fontSize: 16, fontFamily: "Urbanist_700Bold", color: "#fff" },
});
