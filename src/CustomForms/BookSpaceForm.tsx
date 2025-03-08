import React, { useState, useEffect } from 'react';
import { Stack, Text, Spinner, SpinnerSize, Icon } from '@fluentui/react';
import { colours } from '../app/styles/colours';
import { useTheme } from '../app/functionality/ThemeContext';
import BespokeForm, { FormField } from './BespokeForms';
import {
  BoardroomBooking,
  SoundproofPodBooking,
  FutureBookingsResponse
} from '../app/functionality/types';

/**
 * Data for final submission
 */
export interface BookSpaceData {
  fee_earner: string;
  booking_date: string;      // 'YYYY-MM-DD' final format
  booking_time: Date;        // We'll only use the time portion for the DB
  duration: number;
  reason: string;
  spaceType: 'Boardroom' | 'Soundproof Pod';
}

export interface BookSpaceFormProps {
  onCancel: () => void;
  feeEarner: string;
  futureBookings?: FutureBookingsResponse; // Contains boardroomBookings & soundproofBookings
}

const BookSpaceForm: React.FC<BookSpaceFormProps> = ({
  onCancel,
  feeEarner,
  futureBookings
}) => {
  const { isDarkMode } = useTheme();

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // conflict logic
  const [conflict, setConflict] = useState<boolean>(false);
  const [conflictMessage, setConflictMessage] = useState<string>("");

  // form data from BespokeForm
  const [formValues, setFormValues] = useState<{ [key: string]: any }>({});

  // This array will store all bookings for the chosen date/space, for display:
  const [bookingsForDay, setBookingsForDay] = useState<(BoardroomBooking | SoundproofPodBooking)[]>([]);

  // Define our form fields (no mention of “time” requiring a conflict check)
  const formFields: FormField[] = [
    {
      label: 'Space Type',
      name: 'spaceType',
      type: 'dropdown',
      required: true,
      options: ['Boardroom', 'Soundproof Pod'],
    },
    {
      label: 'Booking Date',
      name: 'bookingDate',
      type: 'date',
      required: true,
      placeholder: 'YYYY-MM-DD',
    },
    {
      label: 'Start Time',
      name: 'bookingTime',
      type: 'time',
      required: true,
      placeholder: 'HH:MM',
    },
    {
      label: 'Duration (hours)',
      name: 'duration',
      type: 'number',
      required: true,
      placeholder: 'Enter duration in hours',
    },
    {
      label: 'Additional Notes',
      name: 'reason',
      type: 'textarea',
      required: true,
      placeholder: 'Any special requirements...',
    },
  ];

  /***********************************************************************
   * 1) Check Conflicts as soon as the user picks a time that lies within
   *    an existing booking. We ignore duration entirely for the "lock."
   **********************************************************************/
  function checkConflictByStartTimeOnly(values: { [key: string]: any }): boolean {
    const { bookingDate, bookingTime, spaceType } = values;
    if (!bookingDate || !bookingTime || !spaceType) {
      return false;
    }

    // Convert dd/mm/yyyy → yyyy-mm-dd if needed
    let dateStr = bookingDate;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    // build newStart ignoring duration
    let timeStr = bookingTime;
    if (timeStr.length === 5) {
      timeStr = `${timeStr}:00`;
    }
    const newStart = new Date(`${dateStr}T${timeStr}Z`);

    // Filter relevant bookings
    let relevantBookings: (BoardroomBooking | SoundproofPodBooking)[] = [];
    if (futureBookings) {
      relevantBookings =
        spaceType === 'Boardroom'
          ? futureBookings.boardroomBookings
          : futureBookings.soundproofBookings;
    }

    // Just see if newStart is inside any booking’s (start..end)
    for (const booking of relevantBookings) {
      // parse the existing booking’s date/time
      const existingStart = new Date(`${booking.booking_date}T${booking.booking_time}Z`);
      const existingEnd = new Date(existingStart.getTime() + booking.duration * 3600000);

      // If newStart is strictly between existingStart and existingEnd
      // (or equals start?), we say there's a conflict
      if (newStart >= existingStart && newStart < existingEnd) {
        return true;
      }
    }

    return false;
  }

  /***********************************************************************
   * 2) Filter Bookings for the chosen date whenever:
   *    - bookingDate changes
   *    - spaceType changes
   *    Then set them in state so we can show them below the form.
   **********************************************************************/
  useEffect(() => {
    const { bookingDate, spaceType } = formValues;
    if (!bookingDate || !spaceType) {
      setBookingsForDay([]);
      return;
    }

    // same dd/mm/yyyy logic
    let dateStr = bookingDate;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    // Filter the relevant array
    let relevantBookings: (BoardroomBooking | SoundproofPodBooking)[] = [];
    if (futureBookings) {
      relevantBookings =
        spaceType === 'Boardroom'
          ? futureBookings.boardroomBookings
          : futureBookings.soundproofBookings;
    }

    // find all bookings that match dateStr exactly
    const dayBookings = relevantBookings.filter(
      (b) => b.booking_date === dateStr
    );

    setBookingsForDay(dayBookings);
  }, [formValues.bookingDate, formValues.spaceType, futureBookings]);

  /***********************************************************************
   * 3) Watch for changes to bookingTime. If it’s inside an existing booking
   *    -> conflict = true + set a message
   **********************************************************************/
  useEffect(() => {
    const conflictFound = checkConflictByStartTimeOnly(formValues);
    setConflict(conflictFound);

    // If conflictFound, build a message
    if (conflictFound) {
      setConflictMessage(
        'This start time overlaps with an existing booking.'
      );
    } else {
      setConflictMessage('');
    }
  }, [formValues.bookingTime, formValues.bookingDate, formValues.spaceType]);

  /***********************************************************************
   * 4) Handle form updates from BespokeForm
   **********************************************************************/
  const handleFieldChange = (vals: { [key: string]: any }) => {
    setFormValues(vals);
  };

  /***********************************************************************
   * 5) Final submission
   **********************************************************************/
  async function handleFormSubmit(values: { [key: string]: any }) {
    if (conflict) return; // Just in case

    setIsSubmitting(true);
    setSubmissionError(null);

    // build booking_time Date from user input
    let t = values.bookingTime;
    if (t.length === 5) {
      t = t + ':00';
    }
    const bookingTimeDate = new Date(`1970-01-01T${t}Z`);

    const payload: BookSpaceData = {
      fee_earner: feeEarner,
      booking_date: values.bookingDate,
      booking_time: bookingTimeDate,
      duration: Number(values.duration),
      reason: values.reason,
      spaceType: values.spaceType as 'Boardroom' | 'Soundproof Pod',
    };

    try {
      await submitBooking(payload);
      setSubmissionSuccess(true);
      setTimeout(() => {
        onCancel();
      }, 2000);
    } catch (err: any) {
      setSubmissionError(err.message || 'Booking failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // make the actual POST call
  async function submitBooking(data: BookSpaceData) {
    const url = `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_INSERT_BOOK_SPACE_PATH}?code=${process.env.REACT_APP_INSERT_BOOK_SPACE_CODE}`;

    // format time for DB e.g. '09:30:00.0000000'
    const isoTime = data.booking_time.toISOString().split('T')[1].split('Z')[0];
    let [time, fraction = ''] = isoTime.split('.');
    fraction = (fraction + '0000000').slice(0, 7);
    const finalTimeStr = `${time}.${fraction}`;

    const finalPayload = {
      ...data,
      booking_time: finalTimeStr,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload),
    });
    if (!response.ok) {
      throw new Error(`Booking failed with status ${response.status}`);
    }
    return response.json();
  }

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------
  return (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: '20px', position: 'relative' } }}>
      {/* SPINNER while booking in progress */}
      {isSubmitting && (
        <Stack horizontalAlign="center" styles={{ root: { position: 'absolute', width: '100%', zIndex: 1 } }}>
          <Spinner size={SpinnerSize.large} label="Booking in progress..." />
        </Stack>
      )}

      {/* SUCCESS overlay (green with a check) */}
      {submissionSuccess && (
        <Stack
          horizontalAlign="center"
          styles={{
            root: {
              position: 'absolute',
              width: '100%',
              zIndex: 1,
              backgroundColor: '#fff',
              padding: '10px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          }}
        >
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Icon iconName="CheckMark" styles={{ root: { color: 'green', fontSize: '24px' } }} />
            <Text variant="xLarge" styles={{ root: { color: 'green', fontWeight: 600 } }}>
              Booking confirmed!
            </Text>
          </Stack>
        </Stack>
      )}

      {/* ERROR overlay if submission fails */}
      {submissionError && (
        <Stack horizontalAlign="center" styles={{ root: { position: 'absolute', width: '100%', zIndex: 1 } }}>
          <Text variant="large" styles={{ root: { color: 'red' } }}>
            {submissionError}
          </Text>
        </Stack>
      )}

      {/* Conflict Message (Bigger + Bold) */}
      {conflict && (
        <Stack horizontalAlign="center" styles={{ root: { marginBottom: '10px' } }}>
          <Text variant="large" styles={{ root: { color: colours.cta, fontWeight: 600 } }}>
            {conflictMessage}
          </Text>
        </Stack>
      )}

      {/* Our main BespokeForm */}
      <BespokeForm
        fields={formFields}
        onSubmit={handleFormSubmit}
        onCancel={onCancel}
        onChange={handleFieldChange}
        matters={[]}
        // disable submit if conflict or isSubmitting
        submitDisabled={conflict || isSubmitting}
        conflict={conflict}
      />

      {/* Show existing bookings for that date */}
      {bookingsForDay.length > 0 && (
        <Stack
          styles={{
            root: {
              backgroundColor: isDarkMode ? '#333' : '#f9f9f9',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              marginTop: '10px',
            },
          }}
        >
          <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: '8px' } }}>
            Existing bookings for {formValues.bookingDate} ({formValues.spaceType}):
          </Text>
          {bookingsForDay.map((b) => {
            // Format the start and end times e.g. '09:00' -> '09:00:00Z' => new Date => local HH:MM
            const start = new Date(`${b.booking_date}T${b.booking_time}Z`);
            const end = new Date(start.getTime() + b.duration * 3600000);

            const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <Text key={b.id} variant="smallPlus" styles={{ root: { marginBottom: '4px' } }}>
                • {startStr} to {endStr} – {b.reason}
              </Text>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};

export default BookSpaceForm;
