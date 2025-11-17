#include <iostream>
#include <string>

using namespace std;

extern string grid[3][3];
extern int currentTurn;
extern int filled;
extern bool isGameActive;
extern string errorMessage; 
extern string recentTurn;
extern string PLAYER1;
extern string PLAYER2;
extern string RESET;
extern string p1piece;
extern string p2piece;

void turnTaking() {
    if (!isGameActive) return;
    string command;
    getline(cin, command);

    if (command.length() == 2) {
        int y = tolower(command[0]) - 'a'; /* Allows the game to know which row to place piece into */
        int x = command[1] - '1'; /* Allows the game to know which column to place piece into */

        if (x >= 0 && x < 3 && y >= 0 && y < 3) {
            if (grid[y][x] == " ") { /* If x and y positions are valid, checks if cell is empty */
                string piece;
                piece = (currentTurn == 1) ? p1piece : p2piece; /* Checks whos turn it is to determine which piece to play */
                if (currentTurn == 1) piece = PLAYER1 + p1piece + RESET;
                else piece = PLAYER2 + p2piece + RESET;
                grid[y][x] = piece; /* Places the correct piece into the coordinates given */
                filled++;
                recentTurn = piece; /* This is the piece that was just played */
                currentTurn = (currentTurn == 1) ? 2 : 1; /* Changes turn from player 1 to player 2 (or vice versa) */
            }

            else {
                errorMessage = "That cell has been used, try again: "; /* If cell isn't empty, displays a message to the player allowing for a retry */
            }
        } else {
            errorMessage = "That isn't a valid cell, try again 1: "; /* If the position provided isn't valid, allows for a retry */
        }
    }
    
    else {
        errorMessage = "That isn't a valid cell, try again 2: "; /* If the position provided isn't valid, allows for a retry */
    }
}
