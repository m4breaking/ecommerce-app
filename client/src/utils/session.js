export const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};
