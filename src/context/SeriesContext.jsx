import { createContext, useContext, useState } from "react";

const SeriesContext = createContext(null);

export function SeriesProvider({ children }) {
  const [seriesFilter, setSeriesFilter] = useState("All");
  return (
    <SeriesContext.Provider value={{ seriesFilter, setSeriesFilter }}>
      {children}
    </SeriesContext.Provider>
  );
}

export function useSeriesFilter() {
  return useContext(SeriesContext);
}
