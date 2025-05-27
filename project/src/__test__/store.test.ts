import { store } from '../store';
import { setEquipment, setEquipmentLoading, setEquipmentError, setLabs, setLabLoading, setLabError } from '../store';

describe('Redux Store', () => {
  it('should handle equipment actions', () => {
    const initialState = store.getState().equipment;
    expect(initialState.items).toEqual([]);
    expect(initialState.loading).toBe(false);
    expect(initialState.error).toBe(null);

    store.dispatch(setEquipmentLoading(true));
    expect(store.getState().equipment.loading).toBe(true);

    const now = new Date().toISOString();
    const mockEquipment = [{
      id: '1',
      name: 'Test Equipment',
      manufacturer: '',
      model: '',
      status: 'operational' as const,
      type: 'Test Type',
      remainingUnits: 5,
      category: 'Test Category',
      lab_id: '1',
      description: 'Test Description',
      image_url: 'http://example.com/image.jpg',
      quantity: 10,
      units_under_maintenance: 2,
      units_under_reservation: 3,
      detailed_specs: {
        dimensions: '',
        weight: '',
        power_requirements: '',
        calibration_interval: '',
        safety_requirements: '',
        operating_conditions: ''
      },
      specifications: {},
      created_at: now,
      updated_at: now
    }];
    store.dispatch(setEquipment(mockEquipment));
    expect(store.getState().equipment.items).toEqual(mockEquipment);
    expect(store.getState().equipment.loading).toBe(false);

    store.dispatch(setEquipmentError('Test error'));
    expect(store.getState().equipment.error).toBe('Test error');
    expect(store.getState().equipment.loading).toBe(false);
  });

  it('should handle lab actions', () => {
    const initialState = store.getState().labs;
    expect(initialState.items).toEqual([]);
    expect(initialState.loading).toBe(false);
    expect(initialState.error).toBe(null);

    store.dispatch(setLabLoading(true));
    expect(store.getState().labs.loading).toBe(true);

    const now = new Date().toISOString();
    const mockLabs = [{
      id: 'lab1',
      name: 'Test Lab',
      location: 'Building 1',
      capacity: 20,
      status: 'available' as const,
      description: 'Test Lab Description',
      manager_id: 'user1',
      image_url: 'http://example.com/lab.jpg',
      features: 'Feature1,Feature2',
      users: [],
      created_at: now,
      updated_at: now
    }];
    store.dispatch(setLabs(mockLabs));
    expect(store.getState().labs.items).toEqual(mockLabs);
    expect(store.getState().labs.loading).toBe(false);

    store.dispatch(setLabError('Lab error'));
    expect(store.getState().labs.error).toBe('Lab error');
    expect(store.getState().labs.loading).toBe(false);
  });
});
