const VENUES = {
  'Mexico City': 'Estadio Azteca, Mexico City',
  'Monterrey': 'Estadio BBVA, Monterrey',
  'Monterrey (Guadalupe)': 'Estadio BBVA, Monterrey',
  'Guadalajara': 'Estadio Akron, Guadalajara',
  'Guadalajara (Zapopan)': 'Estadio Akron, Guadalajara',
  'Vancouver': 'BC Place, Vancouver',
  'Toronto': 'BMO Field, Toronto',
  'Dallas (Arlington)': 'AT&T Stadium, Arlington (Dallas)',
  'Los Angeles (Inglewood)': 'SoFi Stadium, Inglewood (Los Angeles)',
  'San Francisco Bay Area (Santa Clara)': "Levi's Stadium, Santa Clara (Bay Area)",
  'Las Vegas': 'Allegiant Stadium, Las Vegas',
  'Kansas City': 'Arrowhead Stadium, Kansas City',
  'Denver': 'Empower Field at Mile High, Denver',
  'Seattle': 'Lumen Field, Seattle',
  'Boston (Foxborough)': 'Gillette Stadium, Foxborough (Boston)',
  'New York/New Jersey (East Rutherford)': 'MetLife Stadium, East Rutherford (NYC)',
  'Philadelphia': 'Lincoln Financial Field, Philadelphia',
  'Miami (Miami Gardens)': 'Hard Rock Stadium, Miami Gardens',
  'Houston': 'NRG Stadium, Houston',
  'Atlanta': 'Mercedes-Benz Stadium, Atlanta',
  'Charlotte': 'Bank of America Stadium, Charlotte',
};

export function lookupVenue(ground) {
  return VENUES[ground] ?? ground;
}
