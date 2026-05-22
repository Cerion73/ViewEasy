import React, { createContext, useContext, useState } from 'react';

const TeamContext = createContext(null);

export const TeamProvider = ({ children }) => {
  const [activeTeam, setActiveTeam] = useState(null);

  const switchToTeam = (team) => {
    setActiveTeam(team);
  };

  const switchToPersonal = () => {
    setActiveTeam(null);
  };

  return (
    <TeamContext.Provider value={{ activeTeam, switchToTeam, switchToPersonal }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => useContext(TeamContext);
