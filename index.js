import { readFileSync } from "fs";
import { pipe, fromPairs, zip, uniq } from 'remeda';
import config from "./config.js";
import { openLoyalty } from "./openLoyalty/client.js";

const importTsvAsJson = () => {
    // read spreadsheet
    const tsvString = readFileSync("./042022DupesTest.tsv", "utf-8");

    return pipe(
        tsvString,
        str => str.split('\r\n'),
        arr => arr.map(
            str=> str.split('\t')
        ),
        arr => { 
            const head = arr[0];
            const tail = arr.slice(1);
    
            return tail.map(
                row => fromPairs(zip(head, row))
            );
        }
    )
}



const findAndDeleteDupes = () => {
    const jsonData = importTsvAsJson();

    var dupes = 0;
    var valids = 0;
    var spentOrInactive = 0;

    const result = jsonData.reduce((processedPointTransferRows, currentPointTransferRow) => {
        // placing each row into either validRows or duplicateRows based on email, comment, and createdAt timestamp
        const { duplicatePointTransfers, validPointTransfers } = processedPointTransferRows;

        // the createdAt value of the current row in consideration
        const currentPointTransferTimestamp = new Date(currentPointTransferRow.created_at);

        // from the list of all valid point transfers, get all emails
        const processedCustomerEmailsList = uniq(validPointTransfers.map(v => v.customer_email));

        // from the list of all valid point transfers, get all point transfers where the comment matches the current point transfer's comment (if any) and get the timestamp
        const validDates = 
            validPointTransfers
                .filter(v => v.comment === currentPointTransferRow.comment)
                .map(v => new Date(v.created_at));

        // true/false that the customer's email been processed for at least one valid point transfer
        const emailInValidPointTransfers = processedCustomerEmailsList.includes(currentPointTransferRow.customer_email);

        // true/false that the createdAt timestamp (assuming the comment matched) is valid by being at least 1 minute apart from any existing valid points transfer timestamps
        const createdAtAndCommentIsValid = validDates.some(vd => Math.abs(vd - currentPointTransferTimestamp) > 60000);

        const isFirstPointTransferOfItsKind = !processedCustomerEmailsList.includes(currentPointTransferRow.comment);

        // we're going to skip all Article Read events for now... so all Article Read point transfers are valid
        const isTypeArticleRead = currentPointTransferRow.comment === "Article Read";
        const isSpending = currentPointTransferRow.type === "spending";
        const isNotActive = currentPointTransferRow.state !== "active";

        // we don't want to handle any refund or cancelled events, so we'll just skip them and throw them away
        if (isSpending || isNotActive) {
            spentOrInactive++;
            return {
                ...processedPointTransferRows
            }
        }

        // again we're not counting article read events
        // we're going to automatically add the point transfer if it is the first instance of a customer_email in the dataset
        if (!emailInValidPointTransfers || isFirstPointTransferOfItsKind || isTypeArticleRead) {

            // add it to the validPointTransfers list
            valids++;
            return {
                ...processedPointTransferRows, 
                validPointTransfers: 
                [
                    ...validPointTransfers, 
                    currentPointTransferRow
                ]
            }
        }

        // if the email and comment match a data transfer already in the valid list,
        // we're checking to make sure the time stamps aren't suspiciously close (defined in createdAtAndCommentIsValid)
        if (emailInValidPointTransfers && !createdAtAndCommentIsValid) {
            // this variable is just for logging
            var validPointTransferTimestamp = validPointTransfers
                .filter(pointTransfer => 
                    pointTransfer.comment === currentPointTransferRow.comment && 
                    pointTransfer.customer_email === currentPointTransferRow.customer_email)
                .map(pointTransfer => 
                    pointTransfer.created_at)

            // log to help understand how many dupes there are and how soon after the original they were created
            console.log(
                currentPointTransferRow.customer_email + 
                " already has a " + 
                currentPointTransferRow.comment + 
                " that was created " +
                (new Date(currentPointTransferRow.created_at) - new Date(validPointTransferTimestamp))/1000 + 
                " seconds after the original. Dupe created at " + 
                currentPointTransferRow.created_at
            )

            // add it to the duplicatePointTransfers list
            dupes++;
            return {
                ...processedPointTransferRows, 
                duplicatePointTransfers: 
                [
                    ...duplicatePointTransfers, 
                    currentPointTransferRow
                ]
            }
        }
        
        // default: call the point transfer valid and add it to the validPointTransfers list
        valids++;
        return {
            ...processedPointTransferRows, 
            validPointTransfers: 
            [
                ...validPointTransfers, 
                currentPointTransferRow
            ]
        }
    },
    {
        duplicatePointTransfers: [],
        validPointTransfers: []
    })

    console.log("------------------------------------------------------------------------")
    console.log("Total dupe point transfers: ", dupes)
    console.log("Total valid point transfers: ", valids)
    console.log("Skipped spending point transfers: ", spentOrInactive)
    console.log("Total processed (and this should be the total of the previous counts): ", jsonData.length)
    console.log("------------------------------------------------------------------------")

    result.duplicatePointTransfers.forEach(async (pointTransfer) => {
        return await cancelPointTransfer(pointTransfer.points_transfer_id);
    });

    return result;
}



const cancelPointTransfer = async (transferId) => {
    if (!transferId) {
        console.log("No points transfer found with transferId", transferId);
        return 404;
    }
    console.log("cancel initiated for point transfer", transferId);
    try {
        const url = `/api/${config.OPENLOYALTY_ENV}/points/transfer/${transferId}/cancel`
        const result = await openLoyalty
            .post(url, { })
            .then(r => {
                console.log(JSON.stringify(r))
                return r;
            });
        console.log(result);
            
        return result;
    } catch (e) {
        throw {
            statusCode: 500,
            body: {
                message: "OpenLoyalty deletePointTransfers returned unexpected response",
                errors: JSON.stringify(e)
            }
        }
    }
}



// main method
findAndDeleteDupes();