import { describe, it, expect } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import {
  TripsStoreProvider,
  useTripsStore,
} from "./trips-store-context";
import { MOCK_TRIPS } from "@/lib/mock/trips";

describe("TripsStoreContext React Provider & Hook", () => {
  it("ném ngoại lệ nếu useTripsStore được gọi bên ngoài TripsStoreProvider", () => {
    function InvalidConsumer() {
      useTripsStore();
      return null;
    }

    expect(() => {
      renderToString(React.createElement(InvalidConsumer));
    }).toThrow("useTripsStore must be used within a TripsStoreProvider");
  });

  it("cung cấp giá trị khởi tạo chính xác khi truyền initialTrips", () => {
    function Consumer() {
      const { trips, isLoading, error } = useTripsStore();
      return React.createElement(
        "div",
        { id: "store-state" },
        `count:${trips.length};loading:${isLoading};error:${error === null}`
      );
    }

    const html = renderToString(
      React.createElement(
        TripsStoreProvider,
        { initialTrips: [...MOCK_TRIPS] },
        React.createElement(Consumer)
      )
    );

    expect(html).toContain("count:3;loading:false;error:true");
  });

  it("khởi tạo state rỗng và loading=true khi không truyền initialTrips (sẵn sàng chờ effect)", () => {
    function Consumer() {
      const { trips, isLoading } = useTripsStore();
      return React.createElement(
        "div",
        null,
        `count:${trips.length};loading:${isLoading}`
      );
    }

    const html = renderToString(
      React.createElement(
        TripsStoreProvider,
        null,
        React.createElement(Consumer)
      )
    );

    expect(html).toContain("count:0;loading:true");
  });
});
