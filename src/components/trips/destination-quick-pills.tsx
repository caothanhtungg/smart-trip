"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DestinationQuickPillsProps {
  currentValue: string;
  onSelect: (destination: string) => void;
}

const DESTINATION_SUGGESTIONS = [
  { shortName: "Tràng An", fullName: "Tràng An – Tam Cốc, Ninh Bình" },
  { shortName: "Sơn Đoòng", fullName: "Hang Sơn Đoòng & Phong Nha, Quảng Bình" },
  { shortName: "Hạ Long", fullName: "Vịnh Hạ Long, Quảng Ninh" },
  { shortName: "Sa Pa", fullName: "Sa Pa – Đỉnh Fansipan, Lào Cai" },
  { shortName: "Hà Giang", fullName: "Cao nguyên đá Đồng Văn, Hà Giang" },
  { shortName: "Mỹ Sơn", fullName: "Thánh địa Mỹ Sơn, Quảng Nam" },
  { shortName: "Cố đô Huế", fullName: "Quần thể di tích Cố đô Huế, Thừa Thiên Huế" },
  { shortName: "Chùa Thiên Mụ", fullName: "Chùa Thiên Mụ, Hương Hồ, TP. Huế" },
  { shortName: "Hội An", fullName: "Phố cổ Hội An, Quảng Nam" },
  { shortName: "Cát Bà", fullName: "Quần đảo Cát Bà – Vịnh Lan Hạ, Hải Phòng" },
  { shortName: "Bản Giốc", fullName: "Thác Bản Giốc & Non nước Cao Bằng" },
  { shortName: "Phú Quốc", fullName: "Đảo Ngọc Phú Quốc, Kiên Giang" },
  { shortName: "Đà Lạt", fullName: "Thành phố ngàn hoa Đà Lạt, Lâm Đồng" },
  { shortName: "Côn Đảo", fullName: "Quần đảo Côn Đảo, Bà Rịa – Vũng Tàu" },
  { shortName: "Mũi Né", fullName: "Mũi Né – Phan Thiết, Bình Thuận" },
  { shortName: "Mai Châu", fullName: "Thung lũng Mai Châu, Hòa Bình" },
  { shortName: "Núi Bà Đen", fullName: "Núi Bà Đen, Tây Ninh" },
  { shortName: "Bà Nà Hills", fullName: "Sun World Ba Na Hills, Đà Nẵng" },
  { shortName: "Tam Đảo", fullName: "Thị trấn Tam Đảo, Vĩnh Phúc" },
  { shortName: "Ba Vì", fullName: "Vườn Quốc gia Ba Vì, Hà Nội" },
  { shortName: "Hàm Lợn", fullName: "Núi Hàm Lợn, Sóc Sơn, Hà Nội" },
  { shortName: "Sầm Sơn", fullName: "Bãi biển Sầm Sơn, Thanh Hóa" },
  { shortName: "Tam Chúc", fullName: "Quần thể Chùa Tam Chúc, Hà Nam" },
  { shortName: "Bát Tràng", fullName: "Làng gốm Bát Tràng, Gia Lâm, Hà Nội" },
  { shortName: "Eo Gió", fullName: "Khu du lịch Eo Gió, Quy Nhơn, Bình Định" },
  { shortName: "Nha Trang", fullName: "Vịnh Nha Trang, Khánh Hòa" },
];

export function DestinationQuickPills({
  currentValue,
  onSelect,
}: DestinationQuickPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <span className="text-xs font-medium text-text-muted mr-1 select-none">
        Gợi ý:
      </span>
      {DESTINATION_SUGGESTIONS.map((item) => {
        const isSelected = currentValue === item.fullName;
        return (
          <button
            key={item.shortName}
            type="button"
            onClick={() => onSelect(item.fullName)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer border",
              isSelected
                ? "bg-cerulean text-white border-cerulean shadow-xs"
                : "bg-hover-row/70 hover:bg-hover-row text-yale-blue border-border-hairline/60"
            )}
          >
            {item.shortName}
          </button>
        );
      })}
    </div>
  );
}
