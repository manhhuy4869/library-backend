import pretty from 'pino-pretty';
import { createStream } from 'rotating-file-stream';

interface PrettyDailyOptions {
  logDirectory: string;
  prettyOptions: Parameters<typeof pretty>[0];
}

function formatDate(value: Date | number) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function prettyDailyTransport({ logDirectory, prettyOptions }: PrettyDailyOptions) {
  const destination = createStream(
    (time) => `app-${formatDate(time ?? new Date())}.log`,
    { path: logDirectory, interval: '1d', intervalBoundary: true, initialRotation: true },
  );

  return pretty({ ...prettyOptions, destination });
}