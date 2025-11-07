#include <string>
#include <iostream>
#include <iomanip> /* Provides formatting, useful for the calendar layout */
#include <ctime> /* Provides ability to use today's date */

using namespace std;

bool leapYearChecker(int year) { /* Creates a True/False statement to check if year given is divisible by 4 or 400, but not by 100 (centuries aren't leap years!) */
	return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
}

int generateCorrectDay(int month, int year) {
	tm time_in = {}; /* Creates empty variables to use to correctly find start day of the month */
	time_in.tm_year = year - 1900; /* Calculate how many years since 1900 */
	time_in.tm_mon = month - 1; /* Starts at 0, so September would be 8 */
	time_in.tm_mday = 1; /* First day of the month is always 1 */
	mktime(&time_in); /* Calculates the correct day of the week*/
	return time_in.tm_wday; /* Returns the first weekday of the month, 1 would represent Monday */
}

void generateCalendar(int month, int year, int startDay, int highlightDay = 0) {
	string monthNames[] = { "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" }; /* Creates an array of the names for each month */
	int daysInMonth[] = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 }; /* Creates an array of the number of days in each month */
	if (leapYearChecker(year)) daysInMonth[1] = 29; /* Adds the 29th day to February for leap years */
	cout << "       " << monthNames[month - 1] << "  " << year << "\n"; /* Prints month name and year, given by the user */
	cout << "---------------------------\n";
	cout << "Sun Mon Tue Wed Thu Fri Sat\n"; /* Prints shorthand names for days of the week */
	for (int i = 0; i < startDay; i++) { /* Prints spaces before the first day of the month */
		cout << "    ";
	}
	for (int day = 1; day <= daysInMonth[month - 1]; day++) { /* Generates the days, starting at 1 in a 7 day format */
		if (day == highlightDay) {
			cout << "\033[33m" << setw(3) << day << "\033[0m "; /* Highlights the given day, or today if the user picked 'today' */
		}
		else {
			cout << setw(3) << day << " "; /* No highlight on other days */
		}
		if ((day + startDay) % 7 == 0) cout << "\n";
	}
}

int main()
{
	string choice;
	string monthNames[] = { "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" }; /* Creates an array of the names for each month */
	int daysInMonth[] = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 }; /* Creates an array of the number of days in each month */
	int today, month, year; /* Defines month and year as an integer value */
	cout << "Type 'today' to use today's date, or 'let me pick' to choose your own!\n"; /* Gives the user two choices */
	getline(cin, choice); /* Accepts string of text, rather than 1 word arguments */
	cout << "\n\n";
	if (choice == "today") {
		time_t t = time(nullptr); /* Grabs the current time, in seconds since Jan 1st 1970 */
		tm now; /* holds the variables for local time */
		localtime_s(&now, &t); /* Converts the time in seconds so its readable, into yy/mm/dd /h/m/s */
		today = now.tm_mday; /* Calculates which date is today */
		month = now.tm_mon + 1; /* Allows month to start at 1 instead of 0, for 1 - 12 format */
		year = now.tm_year + 1900; /* Calculates how many years it has been since 1900, for accuracy */
		int startDay = generateCorrectDay(month, year); /* Function to prevent repeated code, generates correct start day of the month */
		generateCalendar(month, year, startDay, today); /* Function to prevent repeated code, generates calendar for the given month/year */
		cout << "\n\n"; /* Allows 'Press any key to continue... to be on a new line instead of next to the days */
		system("pause"); /* Prevent console from automatically closing until user presses a key */
		return 0;
	} else if (choice == "let me pick") {
		cout << "Enter a Month [1-12]\n"; /* Prints a string to the console */
		cin >> month; /* Requires user the input an integer */
		if (month <= 0 || month >= 13) { /* Makes sure the user enters a valid month */
			cout << "Invalid month, please enter 1-12!\n";
			system("pause");
			return 0;
		}
		cout << "\n";
		cout << "Enter a Year [1970+]\n";
		cin >> year;
		if (year < 1970) { /* Makes sure the user enters a valid year, 1970+ for accurate results */
			cout << "Invalid year, please enter a year from 1970 onwards!\n";
			system("pause");
			return 0;
		}
		cout << "\n";
		int chosenDay = 0; /* If the date isn't the one the user selected, no highlight added */
		if (leapYearChecker(year)) daysInMonth[1] = 29;
		cout << "Enter a Day [1-" << daysInMonth[month - 1] << "]\n"; /* Lets the user pick a date out of available days of the chosen month */
		cin >> chosenDay;
		if (chosenDay < 1 || chosenDay > daysInMonth[month - 1]) { /* Makes sure the user enters a day of the month */
			cout << "Invalid day, please enter 1-" << daysInMonth[month - 1] << "!\n";
			system("pause");
			return 0;
		}
		int startDay = generateCorrectDay(month, year);
		generateCalendar(month, year, startDay, chosenDay);
		cout << "\n\n";
		system("pause");
		return 0;
	}
}
