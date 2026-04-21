export const MTA_SUBWAY_FEEDS: Record<string, string> = {
  'ACE':  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace',
  'BDFM': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm',
  'G':    'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
  'JZ':   'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz',
  'NQRW': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw',
  'L':    'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l',
  '1234567': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs',
  'SIR':  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si',
};

export const FEED_FOR_LINE: Record<string, string> = {
  'A': 'ACE', 'C': 'ACE', 'E': 'ACE', 'H': 'ACE', 'FS': 'ACE',
  'B': 'BDFM', 'D': 'BDFM', 'F': 'BDFM', 'M': 'BDFM',
  'G': 'G',
  'J': 'JZ', 'Z': 'JZ',
  'N': 'NQRW', 'Q': 'NQRW', 'R': 'NQRW', 'W': 'NQRW',
  'L': 'L',
  '1': '1234567', '2': '1234567', '3': '1234567',
  '4': '1234567', '5': '1234567', '6': '1234567',
  '7': '1234567', 'S': '1234567', 'GS': '1234567',
  'SI': 'SIR', 'SIR': 'SIR',
};

export const MTA_ALERTS = {
  all:    'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fall-alerts',
  subway: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts',
  bus:    'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fbus-alerts',
};

export const MTA_BUS_SIRI_BASE = 'https://bustime.mta.info/api/siri';
