import { ErrorLogsRepository } from "../repositories/error-logs.repository";



const errorLogRepo = new ErrorLogsRepository();
export class CommonMethods {

    /**
     * The function `validateEmailAndPhone` validates the format of an email and phone number provided in
     * an object and returns a validation result.
     * @param {any} item - The `validateEmailAndPhone` function takes an `item` object as a parameter. This
     * `item` object is expected to have `email` and `phone` properties that represent an email address and
     * a phone number, respectively. The function then validates the format of the email and phone number
     * using
     * @returns The function `validateEmailAndPhone` returns an object with two properties: `isValid` and
     * `message`.
     */
    validateEmailAndPhone(item: any) {
        const { email, phone } = item;

        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email || !emailRegex.test(email)) {
            console.log(`Invalid email format: ${email}`);
            return { isValid: false, message: `Invalid email format: ${email}` };
        }

        // Validate phone format (simple example, you can modify for more complex validation)
        const phoneRegex = /^[0-9]{7,15}$/; // Example for validating 10-digit phone numbers
        if (!phone || !phoneRegex.test(phone)) {
            console.log(`Invalid phone format: ${phone}`);
            return { isValid: false, message: `Invalid phone format: ${phone}` };
        }

        // If both email and phone are valid, return true
        return { isValid: true, message: 'Valid entry' };
    }

    /**
     * The function `errorLogger` asynchronously logs error details using an errorLogRepo.
     * @param {any} errorDetail - The `errorDetail` parameter is likely an object containing details about
     * the error that occurred. This could include information such as the error message, stack trace,
     * timestamp, and any other relevant data that can help in diagnosing and troubleshooting the error.
     */
    async errorLogger(errorDetail: any) {
        await errorLogRepo.add(errorDetail);
    }
}


