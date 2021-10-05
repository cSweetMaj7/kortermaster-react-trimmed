import { injectable } from 'inversify';


export interface ILoggingService {
    log(message: string): void
}

@injectable()
export class LoggingService implements ILoggingService {

    log(message: string): void {
        console.log(message);
    }

}