import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Equipment, Reservation, Lab, lab_reservations } from './types';

interface EquipmentState {
  items: Equipment[];
  loading: boolean;
  error: string | null;
}

interface ReservationState {
  items: Reservation[];
  loading: boolean;
  error: string | null;
}

interface LabState {
  items: Lab[];
  loading: boolean;
  error: string | null;
}
interface LabReservationState {
  items: lab_reservations[];
  loading: boolean;
  error: string | null;
}

const equipmentSlice = createSlice({
  name: 'equipment',
  initialState: {
    items: [],
    loading: false,
    error: null
  } as EquipmentState,
  reducers: {
    setEquipment: (state, action: PayloadAction<Equipment[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

const reservationSlice = createSlice({
  name: 'reservations',
  initialState: {
    items: [],
    loading: false,
    error: null
  } as ReservationState,
  reducers: {
    setReservations: (state, action: PayloadAction<Reservation[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addReservation: (state, action: PayloadAction<Reservation>) => {
      state.items.push(action.payload);
    },
    updateReservation: (state, action: PayloadAction<Reservation>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});
const labSlice = createSlice({
  name: 'labs',
  initialState: {
    items: [],
    loading: false,
    error: null
  } as LabState,
  reducers: {
    setLabs: (state, action: PayloadAction<Lab[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addLab: (state, action: PayloadAction<Lab>) => {
      state.items.push(action.payload);
    },
    updateLab: (state, action: PayloadAction<Lab>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

const labReservationSlice = createSlice({
  name: 'labReservations',
  initialState: {
    items: [],
    loading: false,
    error: null
  } as LabReservationState,
  reducers: {
    setLabReservations: (state, action: PayloadAction<lab_reservations[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addLabReservation: (state, action: PayloadAction<lab_reservations>) => {
      state.items.push(action.payload);
    },
    updateLabReservation: (state, action: PayloadAction<lab_reservations>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});


export const {
  setEquipment,
  setLoading: setEquipmentLoading,
  setError: setEquipmentError
} = equipmentSlice.actions;

export const {
  setReservations,
  addReservation,
  updateReservation,
  setLoading: setReservationLoading,
  setError: setReservationError
} = reservationSlice.actions;

export const {
  setLabs,
  addLab,
  updateLab,
  setLoading: setLabLoading,
  setError: setLabError
} = labSlice.actions;

export const {
  setLabReservations,
  addLabReservation,
  updateLabReservation,
  setLoading: setLabReservationLoading,
  setError: setLabReservationError
} = labReservationSlice.actions;

export const store = configureStore({
  reducer: {
    equipment: equipmentSlice.reducer,
    reservations: reservationSlice.reducer,
    labs: labSlice.reducer,
    labReservations: labReservationSlice.reducer
  }
});
// Add at the bottom of store.ts
export type RootState = ReturnType<typeof store.getState>;