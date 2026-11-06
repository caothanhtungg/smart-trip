import { describe, it, expect } from "vitest";
import {
  TRAVEL_GUIDES,
  getAllGuides,
  getGuideBySlug,
  filterGuidesByRegion,
  searchGuides,
  GUIDE_REGION_TABS,
} from "./guide-data";

describe("Travel Guides Domain & Data Contracts", () => {
  it("provides comprehensive curated travel guides covering user-provided Vietnam regions", () => {
    expect(TRAVEL_GUIDES.length).toBeGreaterThanOrEqual(3);

    for (const guide of TRAVEL_GUIDES) {
      expect(guide.id).toBeDefined();
      expect(guide.slug).toBeDefined();
      expect(guide.title).toBeDefined();
      expect(guide.destination).toBeDefined();
      expect(guide.coverPhoto).toBeDefined();
      expect(guide.coverPhoto.url).toContain("unsplash.com");
      expect(guide.bestSeason).toBeDefined();
      expect(guide.estimatedBudget).toBeDefined();
      expect(guide.sections.packingList.length).toBeGreaterThan(0);
      expect(guide.sections.sampleDays.length).toBeGreaterThan(0);
      expect(guide.sections.foodHighlights.length).toBeGreaterThan(0);
      expect(guide.sections.budgetTips.length).toBeGreaterThan(0);
    }
  });

  it("retrieves a specific guide by slug correctly", () => {
    const guide = getGuideBySlug("cam-nang-trang-an-tam-coc-ninh-binh-3n2d");
    expect(guide).toBeDefined();
    expect(guide?.destination).toContain("Tràng An");
    expect(guide?.sections.sampleDays.length).toBe(3);

    const halongGuide = getGuideBySlug("cam-nang-du-lich-vinh-ha-long-quang-ninh-3n2d");
    expect(halongGuide).toBeDefined();
    expect(halongGuide?.destination).toContain("Hạ Long");

    const sapaGuide = getGuideBySlug("cam-nang-du-lich-sa-pa-fansipan-3n2d");
    expect(sapaGuide).toBeDefined();
    expect(sapaGuide?.destination).toContain("Sa Pa");

    const hagiangGuide = getGuideBySlug("cam-nang-du-lich-ha-giang-loop-dong-van-3n2d");
    expect(hagiangGuide).toBeDefined();
    expect(hagiangGuide?.destination).toContain("Đồng Văn");

    const mySonGuide = getGuideBySlug("cam-nang-du-lich-my-son-hoi-an-3n2d");
    expect(mySonGuide).toBeDefined();
    expect(mySonGuide?.destination).toContain("Mỹ Sơn");
    expect(mySonGuide?.region).toBe("central");

    const hueGuide = getGuideBySlug("cam-nang-du-lich-co-do-hue-3n2d");
    expect(hueGuide).toBeDefined();
    expect(hueGuide?.destination).toContain("Huế");
    expect(hueGuide?.region).toBe("central");

    const thienMuGuide = getGuideBySlug("cam-nang-du-lich-chua-thien-mu-hue-3n2d");
    expect(thienMuGuide).toBeDefined();
    expect(thienMuGuide?.destination).toContain("Thiên Mụ");
    expect(thienMuGuide?.region).toBe("central");

    const hoiAnGuide = getGuideBySlug("cam-nang-du-lich-pho-co-hoi-an-3n2d");
    expect(hoiAnGuide).toBeDefined();
    expect(hoiAnGuide?.destination).toContain("Hội An");
    expect(hoiAnGuide?.region).toBe("central");

    const catBaGuide = getGuideBySlug("cam-nang-du-lich-cat-ba-lan-ha-3n2d");
    expect(catBaGuide).toBeDefined();
    expect(catBaGuide?.destination).toContain("Cát Bà");
    expect(catBaGuide?.region).toBe("north");

    const banGiocGuide = getGuideBySlug("cam-nang-du-lich-thac-ban-gioc-cao-bang-3n2d");
    expect(banGiocGuide).toBeDefined();
    expect(banGiocGuide?.destination).toContain("Bản Giốc");
    expect(banGiocGuide?.region).toBe("north");

    const phuQuocGuide = getGuideBySlug("cam-nang-du-lich-dao-ngoc-phu-quoc-3n2d");
    expect(phuQuocGuide).toBeDefined();
    expect(phuQuocGuide?.destination).toContain("Phú Quốc");
    expect(phuQuocGuide?.region).toBe("islands");

    const dalatGuide = getGuideBySlug("cam-nang-du-lich-da-lat-3n2d");
    expect(dalatGuide).toBeDefined();
    expect(dalatGuide?.destination).toContain("Đà Lạt");
    expect(dalatGuide?.region).toBe("highlands");

    const conDaoGuide = getGuideBySlug("cam-nang-du-lich-con-dao-3n2d");
    expect(conDaoGuide).toBeDefined();
    expect(conDaoGuide?.destination).toContain("Côn Đảo");
    expect(conDaoGuide?.region).toBe("islands");

    const muiNeGuide = getGuideBySlug("cam-nang-du-lich-mui-ne-phan-thiet-3n2d");
    expect(muiNeGuide).toBeDefined();
    expect(muiNeGuide?.destination).toContain("Mũi Né");
    expect(muiNeGuide?.region).toBe("south");

    const maiChauGuide = getGuideBySlug("cam-nang-du-lich-mai-chau-hoa-binh-3n2d");
    expect(maiChauGuide).toBeDefined();
    expect(maiChauGuide?.destination).toContain("Mai Châu");
    expect(maiChauGuide?.region).toBe("north");

    const baDenGuide = getGuideBySlug("cam-nang-du-lich-nui-ba-den-tay-ninh-3n2d");
    expect(baDenGuide).toBeDefined();
    expect(baDenGuide?.destination).toContain("Bà Đen");
    expect(baDenGuide?.region).toBe("south");

    const baNaGuide = getGuideBySlug("cam-nang-du-lich-ba-na-hills-da-nang-3n2d");
    expect(baNaGuide).toBeDefined();
    expect(baNaGuide?.destination).toContain("Bà Nà");
    expect(baNaGuide?.region).toBe("central");

    const tamDaoGuide = getGuideBySlug("cam-nang-du-lich-tam-dao-vinh-phuc-3n2d");
    expect(tamDaoGuide).toBeDefined();
    expect(tamDaoGuide?.destination).toContain("Tam Đảo");
    expect(tamDaoGuide?.region).toBe("north");

    const baViGuide = getGuideBySlug("cam-nang-du-lich-vuon-quoc-gia-ba-vi-3n2d");
    expect(baViGuide).toBeDefined();
    expect(baViGuide?.destination).toContain("Ba Vì");
    expect(baViGuide?.region).toBe("north");

    const hamLonGuide = getGuideBySlug("cam-nang-du-lich-nui-ham-lon-soc-son-3n2d");
    expect(hamLonGuide).toBeDefined();
    expect(hamLonGuide?.destination).toContain("Hàm Lợn");
    expect(hamLonGuide?.region).toBe("north");

    const samSonGuide = getGuideBySlug("cam-nang-du-lich-sam-son-thanh-hoa-3n2d");
    expect(samSonGuide).toBeDefined();
    expect(samSonGuide?.destination).toContain("Sầm Sơn");
    expect(samSonGuide?.region).toBe("north");

    const tamChucGuide = getGuideBySlug("cam-nang-du-lich-chua-tam-chuc-ha-nam-3n2d");
    expect(tamChucGuide).toBeDefined();
    expect(tamChucGuide?.destination).toContain("Tam Chúc");
    expect(tamChucGuide?.region).toBe("north");

    const batTrangGuide = getGuideBySlug("cam-nang-du-lich-lang-gom-bat-trang-3n2d");
    expect(batTrangGuide).toBeDefined();
    expect(batTrangGuide?.destination).toContain("Bát Tràng");
    expect(batTrangGuide?.region).toBe("north");

    const eoGioGuide = getGuideBySlug("cam-nang-du-lich-eo-gio-quy-nhon-3n2d");
    expect(eoGioGuide).toBeDefined();
    expect(eoGioGuide?.destination).toContain("Eo Gió");
    expect(eoGioGuide?.region).toBe("central");

    const nhaTrangGuide = getGuideBySlug("cam-nang-du-lich-vinh-nha-trang-3n2d");
    expect(nhaTrangGuide).toBeDefined();
    expect(nhaTrangGuide?.destination).toContain("Nha Trang");
    expect(nhaTrangGuide?.region).toBe("central");
  });

  it("returns undefined for non-existent guide slug", () => {
    const guide = getGuideBySlug("non-existent-destination-slug");
    expect(guide).toBeUndefined();
  });

  it("filters guides accurately by region", () => {
    const northGuides = filterGuidesByRegion("north");
    expect(northGuides.length).toBeGreaterThan(0);
    expect(northGuides.every((g) => g.region === "north")).toBe(true);

    const centralGuides = filterGuidesByRegion("central");
    expect(centralGuides.length).toBeGreaterThan(0);
    expect(centralGuides.every((g) => g.region === "central")).toBe(true);

    const islandGuides = filterGuidesByRegion("islands");
    expect(islandGuides.length).toBeGreaterThan(0);
    expect(islandGuides.every((g) => g.region === "islands")).toBe(true);

    const highlandGuides = filterGuidesByRegion("highlands");
    expect(highlandGuides.length).toBeGreaterThan(0);
    expect(highlandGuides.every((g) => g.region === "highlands")).toBe(true);

    const southGuides = filterGuidesByRegion("south");
    expect(southGuides.length).toBeGreaterThan(0);
    expect(southGuides.every((g) => g.region === "south")).toBe(true);

    const all = filterGuidesByRegion("all");
    expect(all.length).toBe(TRAVEL_GUIDES.length);
  });

  it("searches guides effectively by keyword with accent tolerance", () => {
    const tranganResults = searchGuides("trang an");
    expect(tranganResults.length).toBeGreaterThan(0);
    expect(tranganResults.some((g) => g.slug.includes("trang-an"))).toBe(true);

    const sondoongResults = searchGuides("son doong");
    expect(sondoongResults.length).toBeGreaterThan(0);
    expect(sondoongResults.some((g) => g.slug.includes("son-doong"))).toBe(true);

    const halongResults = searchGuides("ha long");
    expect(halongResults.length).toBeGreaterThan(0);
    expect(halongResults.some((g) => g.slug.includes("ha-long"))).toBe(true);

    const sapaResults = searchGuides("sa pa");
    expect(sapaResults.length).toBeGreaterThan(0);
    expect(sapaResults.some((g) => g.slug.includes("sa-pa"))).toBe(true);

    const hagiangResults = searchGuides("ha giang");
    expect(hagiangResults.length).toBeGreaterThan(0);
    expect(hagiangResults.some((g) => g.slug.includes("ha-giang"))).toBe(true);

    const mySonResults = searchGuides("my son");
    expect(mySonResults.length).toBeGreaterThan(0);
    expect(mySonResults.some((g) => g.slug.includes("my-son"))).toBe(true);

    const hueResults = searchGuides("hue");
    expect(hueResults.length).toBeGreaterThan(0);
    expect(hueResults.some((g) => g.slug.includes("co-do-hue"))).toBe(true);

    const thienMuResults = searchGuides("thien mu");
    expect(thienMuResults.length).toBeGreaterThan(0);
    expect(thienMuResults.some((g) => g.slug.includes("chua-thien-mu"))).toBe(true);

    const hoiAnResults = searchGuides("hoi an");
    expect(hoiAnResults.length).toBeGreaterThan(0);
    expect(hoiAnResults.some((g) => g.slug.includes("pho-co-hoi-an"))).toBe(true);

    const catBaResults = searchGuides("cat ba");
    expect(catBaResults.length).toBeGreaterThan(0);
    expect(catBaResults.some((g) => g.slug.includes("cat-ba"))).toBe(true);

    const banGiocResults = searchGuides("ban gioc");
    expect(banGiocResults.length).toBeGreaterThan(0);
    expect(banGiocResults.some((g) => g.slug.includes("thac-ban-gioc"))).toBe(true);

    const phuQuocResults = searchGuides("phu quoc");
    expect(phuQuocResults.length).toBeGreaterThan(0);
    expect(phuQuocResults.some((g) => g.slug.includes("phu-quoc"))).toBe(true);

    const dalatResults = searchGuides("da lat");
    expect(dalatResults.length).toBeGreaterThan(0);
    expect(dalatResults.some((g) => g.slug.includes("da-lat"))).toBe(true);

    const conDaoResults = searchGuides("con dao");
    expect(conDaoResults.length).toBeGreaterThan(0);
    expect(conDaoResults.some((g) => g.slug.includes("con-dao"))).toBe(true);

    const muiNeResults = searchGuides("mui ne");
    expect(muiNeResults.length).toBeGreaterThan(0);
    expect(muiNeResults.some((g) => g.slug.includes("mui-ne"))).toBe(true);

    const maiChauResults = searchGuides("mai chau");
    expect(maiChauResults.length).toBeGreaterThan(0);
    expect(maiChauResults.some((g) => g.slug.includes("mai-chau"))).toBe(true);

    const baDenResults = searchGuides("ba den");
    expect(baDenResults.length).toBeGreaterThan(0);
    expect(baDenResults.some((g) => g.slug.includes("nui-ba-den"))).toBe(true);

    const baNaResults = searchGuides("ba na");
    expect(baNaResults.length).toBeGreaterThan(0);
    expect(baNaResults.some((g) => g.slug.includes("ba-na"))).toBe(true);

    const tamDaoResults = searchGuides("tam dao");
    expect(tamDaoResults.length).toBeGreaterThan(0);
    expect(tamDaoResults.some((g) => g.slug.includes("tam-dao"))).toBe(true);

    const baViResults = searchGuides("ba vi");
    expect(baViResults.length).toBeGreaterThan(0);
    expect(baViResults.some((g) => g.slug.includes("ba-vi"))).toBe(true);

    const hamLonResults = searchGuides("ham lon");
    expect(hamLonResults.length).toBeGreaterThan(0);
    expect(hamLonResults.some((g) => g.slug.includes("ham-lon"))).toBe(true);

    const samSonResults = searchGuides("sam son");
    expect(samSonResults.length).toBeGreaterThan(0);
    expect(samSonResults.some((g) => g.slug.includes("sam-son"))).toBe(true);

    const tamChucResults = searchGuides("tam chuc");
    expect(tamChucResults.length).toBeGreaterThan(0);
    expect(tamChucResults.some((g) => g.slug.includes("tam-chuc"))).toBe(true);

    const batTrangResults = searchGuides("bat trang");
    expect(batTrangResults.length).toBeGreaterThan(0);
    expect(batTrangResults.some((g) => g.slug.includes("bat-trang"))).toBe(true);

    const eoGioResults = searchGuides("eo gio");
    expect(eoGioResults.length).toBeGreaterThan(0);
    expect(eoGioResults.some((g) => g.slug.includes("eo-gio"))).toBe(true);

    const nhaTrangResults = searchGuides("nha trang");
    expect(nhaTrangResults.length).toBeGreaterThan(0);
    expect(nhaTrangResults.some((g) => g.slug.includes("nha-trang"))).toBe(true);
  });

  it("returns all guides via getAllGuides helper", () => {
    expect(getAllGuides().length).toBe(TRAVEL_GUIDES.length);
  });

  it("defines standard region tabs for filter controls", () => {
    const keys = GUIDE_REGION_TABS.map((t) => t.key);
    expect(keys).toContain("all");
    expect(keys).toContain("north");
    expect(keys).toContain("central");
    expect(keys).toContain("south");
    expect(keys).toContain("highlands");
  });
});
