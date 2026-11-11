// Compteur partagé pour que toutes les fenêtres (bureau + NSN Messenger)
// passent correctement au premier plan les unes par rapport aux autres.
let counter = 100
export const nextZ = () => ++counter