import { RoomService } from '../../services/RoomService.js';
import { IconService } from '../../services/IconService.js';

export class RoomSelect {
  constructor(containerId, propertyId) {
    this.container = document.getElementById(containerId);
    this.propertyId = propertyId;
    this.isChangeoverId = propertyId.includes('-'); // Check if it's a UUID
    this.roomService = new RoomService();
    this.rooms = [];
    this.initialize();
  }

  async initialize() {
    try {
      this.rooms = await this.roomService.getRooms(this.propertyId, this.isChangeoverId);
      console.debug('RoomSelect: Initialized with rooms', {
        count: this.rooms.length,
        rooms: this.rooms.map(r => r.name)
      });
      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error('Error loading rooms:', error);
      this.showError();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="mb-3">
        <label for="location" class="form-label d-flex align-items-center gap-2">
          ${IconService.createIcon('MapPin')}
          Location Found
        </label>
        <div class="position-relative">
          <input
            type="text"
            id="location"
            class="form-control"
            list="roomSuggestions"
            placeholder="Select or type a room name..."
            required
            autocomplete="off"
            spellcheck="false"
          />
          <datalist id="roomSuggestions">
            ${this.rooms.map(room => `<option value="${room.name}">`).join('')}
          </datalist>
          <div class="invalid-feedback">
            Please specify where the item was found
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const input = this.container.querySelector('#location');
    
    input.addEventListener('change', async (e) => {
      const value = e.target.value.trim();
      if (!value) return;

      console.debug('RoomSelect: Input blur event', { value });
      
      // Check if room already exists
      const existingRoom = this.rooms.find(room => 
        room.name.toLowerCase() === value.toLowerCase()
      );
      
      if (existingRoom) {
        console.debug('RoomSelect: Using existing room', existingRoom);
        input.value = existingRoom.name; // Normalize case
      } else {
        console.debug('RoomSelect: Creating new room', { value });
        try {
          // Pass the ID (whether changeover or property) to addRoom
          const newRoom = await this.roomService.addRoom(this.propertyId, value);
          if (newRoom) {
            console.debug('RoomSelect: Room created successfully', newRoom);
            // Update rooms list
            await this.initialize();
            // Set input to the exact name from the database
            input.value = newRoom.name;
          }
        } catch (error) {
          console.error('RoomSelect: Error adding room:', error);
          input.value = ''; // Clear invalid input
          input.focus();
          throw error; // Let the form handle the error
        }
      }
    });
  }

  showError() {
    this.container.innerHTML = `
      <div class="mb-3">
        <label for="location" class="form-label d-flex align-items-center gap-2">
          ${IconService.createIcon('MapPin')}
          Location Found
        </label>
        <input
          type="text"
          id="location"
          class="form-control"
          placeholder="Enter room name..."
          required
          autocomplete="off"
          spellcheck="false"
        />
        <div class="invalid-feedback">
          Please specify where the item was found
        </div>
      </div>
    `;
  }

  getValue() {
    return this.container.querySelector('#location').value.trim();
  }
  
  async getRooms() {
    return this.rooms;
  }
}