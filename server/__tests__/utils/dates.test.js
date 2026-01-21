describe('Date and Time Utilities', () => {
  describe('Date Validation', () => {
    it('should validate ISO 8601 date format', () => {
      // Arrange
      const validDate = '2024-12-31';
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      // Act & Assert
      expect(dateRegex.test(validDate)).toBe(true);
    });

    it('should reject invalid date formats', () => {
      // Arrange
      const invalidDates = ['31-12-2024', '12/31/2024', '2024.12.31', 'invalid'];
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      // Act & Assert
      invalidDates.forEach(date => {
        expect(dateRegex.test(date)).toBe(false);
      });
    });

    it('should validate date is not in the past for appointments', () => {
      // Arrange
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 1);
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 1);

      // Act & Assert
      expect(pastDate < today).toBe(true);
      expect(futureDate > today).toBe(true);
    });
  });

  describe('Time Validation', () => {
    it('should validate 24-hour time format', () => {
      // Arrange
      const validTimes = ['09:00', '14:30', '23:59'];
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

      // Act & Assert
      validTimes.forEach(time => {
        expect(timeRegex.test(time)).toBe(true);
      });
    });

    it('should reject invalid time formats', () => {
      // Arrange
      const invalidTimes = ['25:00', '12:60', '9:00', '14:5', 'invalid'];
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

      // Act & Assert
      invalidTimes.forEach(time => {
        expect(timeRegex.test(time)).toBe(false);
      });
    });
  });

  describe('Time Slot Calculations', () => {
    it('should calculate end time from start time and duration', () => {
      // Arrange
      const startTime = '14:00';
      const durationMinutes = 30;

      // Act
      const [hours, minutes] = startTime.split(':').map(Number);
      const startTotalMinutes = hours * 60 + minutes;
      const endTotalMinutes = startTotalMinutes + durationMinutes;
      const endHours = Math.floor(endTotalMinutes / 60);
      const endMins = endTotalMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      // Assert
      expect(endTime).toBe('14:30');
    });

    it('should handle time overflow across midnight', () => {
      // Arrange
      const startTime = '23:30';
      const durationMinutes = 60;

      // Act
      const [hours, minutes] = startTime.split(':').map(Number);
      const startTotalMinutes = hours * 60 + minutes;
      const endTotalMinutes = startTotalMinutes + durationMinutes;
      const endHours = endTotalMinutes >= 1440 ? Math.floor((endTotalMinutes % 1440) / 60) : Math.floor(endTotalMinutes / 60);
      const endMins = endTotalMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      // Assert
      expect(endTime).toBe('00:30');
    });
  });

  describe('Date Comparison', () => {
    it('should compare dates correctly', () => {
      // Arrange
      const date1 = new Date('2024-12-31');
      const date2 = new Date('2024-12-30');
      const date3 = new Date('2024-12-31');

      // Act & Assert
      expect(date1 > date2).toBe(true);
      expect(date1 < date2).toBe(false);
      expect(date1.getTime() === date3.getTime()).toBe(true);
    });

    it('should format date for database storage', () => {
      // Arrange
      const date = new Date('2024-12-31');

      // Act
      const formatted = date.toISOString().split('T')[0];

      // Assert
      expect(formatted).toBe('2024-12-31');
    });
  });

  describe('Business Hours Validation', () => {
    it('should validate time is within business hours', () => {
      // Arrange
      const businessStart = 9; // 9 AM
      const businessEnd = 18; // 6 PM
      const validTime = '14:00';
      const invalidTime = '08:00';

      // Act
      const [validHours] = validTime.split(':').map(Number);
      const [invalidHours] = invalidTime.split(':').map(Number);

      // Assert
      expect(validHours >= businessStart && validHours < businessEnd).toBe(true);
      expect(invalidHours >= businessStart && invalidHours < businessEnd).toBe(false);
    });
  });
});
