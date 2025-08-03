import { NewEnquiry, mockNewEnquiries } from './newEnquiryTypes';

export async function fetchNewEnquiriesData(): Promise<NewEnquiry[]> {
  try {
    const response = await fetch('/api/enquiries', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching new enquiries data:', error);
    // Fallback to mock data if fetch fails
    console.log('Falling back to mock enquiry data');
    return mockNewEnquiries;
  }
}
