import _range from "lodash.range";

// ***************************** Type Declarations *****************************

type Matching = [number, number, string];
type MatchResult = { matchedCount: number; matchings: Matching[] };

interface ConvertedOffer {
    id: number;
    times: string[];
    subject: string;
    user_id: number;
    [key: string]: any;
}

interface PossibleMatching {
    takeOffer: { id: number; user_id: number };
    possible: PossibleGiveOffers[];
}

interface PossibleGiveOffers {
    id: number;
    time: string;
    user_id: number;
}

// ****************************** Basic Functions ******************************

export function convertTimes(offers: any[]): ConvertedOffer[] {
    /**
     * Converts the times value of an offer
     * from {Mo:"7;11",Di:"8".....}
     * to ["Mo07","Mo11","Di08"]
     */

    // Create deep copy of tthe array to not alter it
    const newOffers = JSON.parse(JSON.stringify(offers));

    // For each offer in offers
    for (let i = 0; i < offers.length; i++) {
        // Reset the time value of the offer to nothing
        newOffers[i].times = [];
        // For each key(day) in thisOffer.times
        Object.keys(offers[i].times).forEach((day: string) => {
            // Lessons are stored as 1;3;8 => splitting them into an array
            const lessons = offers[i].times[day].split(";");
            // For each time
            lessons.forEach((lesson: string) => {
                // If there is a lesson and not just an empty string
                if (lesson != "") {
                    // Append the lesson to the times array of the new offer
                    newOffers[i].times.push(
                        // Format it like Mo01
                        day + parseInt(lesson).toString().padStart(2, "0")
                    );
                }
            });
        });
    }

    // Return the converted offer
    return newOffers;
}

function findPossibleGiveOffers(
    takeOffer: ConvertedOffer,
    giveOffers: ConvertedOffer[]
): PossibleGiveOffers[] {
    /**
     * Return a list of all possible giveOffers that can be matched to the takeOffer
     */

    // Initialize an empty array
    const possibleGiveOffers: PossibleGiveOffers[] = [];
    // Iterate over each lesson in the thake offer array
    takeOffer.times.forEach((lesson: string) => {
        // Iterate over all existing give offers
        giveOffers.forEach((giveOffer) => {
            // If the subject of the give offer equals the take offer
            // AND the takeOffers classlevel is between the min_class  and the max_class of the giveOffer
            // AND the give offer contains the lesson of the take offer
            if (
                giveOffer.subject == takeOffer.subject &&
                _range(giveOffer.min_class, giveOffer.max_class).includes(
                    takeOffer.classLevel
                ) &&
                (giveOffer.times as string[]).includes(lesson)
            ) {
                // Append it to the possible give offers
                possibleGiveOffers.push({
                    id: giveOffer.id,
                    user_id: giveOffer.user_id,
                    time: lesson,
                });
            }
        });
    });
    // Return the list
    return possibleGiveOffers;
}

function getAllPossibleMatchings(
    takeOffers: ConvertedOffer[],
    giveOffers: ConvertedOffer[]
): PossibleMatching[] {
    /**
     * Returns all possible matchings of all take offers
     */

    // Initialize possible matchings as empty array
    const possibleMatchings: PossibleMatching[] = [];

    // For each takeOffer
    takeOffers.forEach((takeOffer) => {
        // Append the id of the take offer and all matchable give offers to the list
        possibleMatchings.push({
            takeOffer: { id: takeOffer.id, user_id: takeOffer.user_id },
            possible: findPossibleGiveOffers(takeOffer, giveOffers),
        });
    });
    // Return the list
    return possibleMatchings;
}

function removeOffers(
    offers: ConvertedOffer[],
    searchOffer: { id: number; user_id: number },
    time?: string
): ConvertedOffer[] {
    /**
     * Removes the offer by id and all offers with the same user and time without altering the original array
     */

    // Make a deep copy of the array
    let newOffers: ConvertedOffer[] = JSON.parse(JSON.stringify(offers));
    // Remove the offer which has the same if as the search offer
    newOffers = newOffers.filter((v: ConvertedOffer) => v.id != searchOffer.id);

    // If a time is provided
    if (time) {
        // Initialize return offers as empty
        const returnOffers: ConvertedOffer[] = [];

        // Iterate over each offer
        for (let i = 0; i < newOffers.length; i++) {
            // If there is an offer with the same user_id
            if (newOffers[i].user_id == searchOffer.user_id) {
                // Remove the time of the provided lesson from the list of times
                newOffers[i].times = newOffers[i].times.filter(
                    (v: string) => v != time
                );
            }
            // If the offer has any times left
            if (newOffers[i].times.length > 0) {
                // Add the offers to the return offers
                returnOffers.push(newOffers[i]);
            }
        }

        // Return the offers
        return returnOffers;
    } else {
        // Return the offers
        return newOffers;
    }
}

// ****************************** Match Function *******************************

export async function match(
    takeOffers: ConvertedOffer[],
    giveOffers: ConvertedOffer[]
): Promise<MatchResult> {
    // Initialize matching as empty
    let matching: Matching[] = [];
    // Initialize matchedCount as empty
    let matchedCount = 0;

    // Get all possible matchings for every takeOffer
    const possibleMatchings = getAllPossibleMatchings(takeOffers, giveOffers);

    // Sort the array by the amount of the possible give offers
    possibleMatchings.sort((a, b) => a.possible.length - b.possible.length);

    // ***** If there are no possible matchings (anymore) *****
    if (possibleMatchings.length == 0) {
        // Exit the funktion and return the empty matching and 0 as matchedCount from above
        return { matchedCount: matchedCount, matchings: matching };
    }

    // ***** If the first offer has no possible matchings *****
    if (possibleMatchings[0].possible.length == 0) {
        // Remove the take offer from the list
        const newTakeOffers = removeOffers(
            takeOffers,
            possibleMatchings[0].takeOffer
        );
        // Continue with matching the other take offers
        const newMatch = await match(newTakeOffers, giveOffers);

        // Add the matchedCount from the other offers to this matchedCount
        matchedCount += newMatch.matchedCount;
        // Add the matchings from the other offerrs to this matchings
        matching = matching.concat(newMatch.matchings);

        // Return the matchedCount and the matchings
        return { matchedCount: matchedCount, matchings: matching };
    }

    // ***** If the first offer has exactly one possible matching *****
    if (possibleMatchings[0].possible.length == 1) {
        // Match the take offer with the give Offer
        // Add 1 to matchedCount
        matchedCount++;
        // Add the matching to the list of matchings
        matching.push([
            possibleMatchings[0].takeOffer.id,
            possibleMatchings[0].possible[0].id,
            possibleMatchings[0].possible[0].time,
        ]);

        // Remove the take offer from the list
        const newTakeOffers = removeOffers(
            takeOffers,
            possibleMatchings[0].takeOffer,
            possibleMatchings[0].possible[0].time
        );
        // Remove the give offer from the list
        const newGiveOffers = removeOffers(
            giveOffers,
            possibleMatchings[0].possible[0],
            possibleMatchings[0].possible[0].time
        );

        // Continue with matching the other take offers
        const newMatch = await match(newTakeOffers, newGiveOffers);

        // Add the matchedCount from the other offers to this matchedCount
        matchedCount += newMatch.matchedCount;
        // Add the matchings from the other offerrs to this matchings
        matching = matching.concat(newMatch.matchings);

        // Return the matchedCount and the matchings
        return { matchedCount: matchedCount, matchings: matching };
    }

    // ***** There are more than one possible matchings *****

    // Initialize the currentBestMatchingResult with a matchedCount of -1,
    // so every matching made is better than the start value
    let currentlyBestMatchingResult: MatchResult = {
        matchedCount: -1,
        matchings: [],
    };
    // Declare the currentlyBestMatchingDecision as undefined
    let currentlyBestMatchingDecision: Matching | undefined = undefined;

    // Generate a matching for each possible matching of the take offer
    possibleMatchings[0].possible.forEach(async (giveOfferChosen) => {
        // Remove the take offer from the new list
        const newTakeOffers = removeOffers(
            takeOffers,
            possibleMatchings[0].takeOffer,
            giveOfferChosen.time
        );
        // Remove the give offer from the new list
        const newGiveOffers = removeOffers(
            giveOffers,
            giveOfferChosen,
            giveOfferChosen.time
        );

        // Continue with matching the other take offers
        const newMatch = await match(newTakeOffers, newGiveOffers);

        // If the new match is better than  the currentlyBestMatching
        if (newMatch.matchedCount > currentlyBestMatchingResult.matchedCount) {
            // Set the currentlyBestMatchingResult to the generated matching of the other offers
            currentlyBestMatchingResult = newMatch;
            // Set the currentlyBestMatchingDecision to this matching
            currentlyBestMatchingDecision = [
                possibleMatchings[0].takeOffer.id,
                giveOfferChosen.id,
                giveOfferChosen.time,
            ];
        }
    });

    // If there is a matching generated (currentlyBestMatchingDecision should never be undefined)
    if (currentlyBestMatchingDecision != undefined) {
        // Add the matchedCount of the best matching result to the matchedcount and add 1 to the matched count, because there
        // was a matching made which is stored in the currentlyBestMatchingDecision
        matchedCount += currentlyBestMatchingResult.matchedCount + 1;
        // Add the currentlyBestMatchingDecision to the matchings
        matching.push(currentlyBestMatchingDecision);
        // Add the matchings of the currentlyBestMatchingResult to the matchings
        matching = matching.concat(currentlyBestMatchingResult.matchings);
    }
    // Return the matchedCount and the matchings
    return { matchedCount: matchedCount, matchings: matching };
}

// ******************************** Run Matching ********************************

// const convertedGiveOffers = convertTimes(giveOffers);
// const convertedTakeOffers = convertTimes(takeOffers);

// console.log(JSON.stringify(match(convertedTakeOffers, convertedGiveOffers)));
