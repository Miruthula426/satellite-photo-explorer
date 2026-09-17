import { PresetSatellitePhoto } from '../types';

export const PRESET_PHOTOS: PresetSatellitePhoto[] = [
  {
    id: 'mars-jezero',
    title: 'Jezero Crater Ancient Delta',
    celestialBody: 'Mars',
    mission: 'NASA Mars Reconnaissance Orbiter (HiRISE)',
    // Wikimedia Commons direct high-res NASA public domain
    imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=400&q=75',
    description: 'High-resolution orbital satellite view of ancient fan-shaped river delta deposits inside Mars Jezero Crater, where water flowed billions of years ago.',
    sampleQuestions: [
      'What is the scientific definition of an inverted river delta?',
      'How was this delta deposit formed on ancient Mars?',
      'What satellite sensor captured this terrain resolution?',
      'Is there evidence of organic clay minerals in these layers?'
    ]
  },
  {
    id: 'jupiter-red-spot',
    title: 'The Great Red Spot & Atmospheric Jets',
    celestialBody: 'Jupiter',
    mission: 'NASA Juno Spacecraft (JunoCam)',
    imageUrl: 'https://images.unsplash.com/photo-1614732484003-ef9881555dc3?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1614732484003-ef9881555dc3?auto=format&fit=crop&w=400&q=75',
    description: 'Close orbital pass over Jupiter’s colossal anticyclonic storm system and surrounding turbulent cloud ribbons.',
    sampleQuestions: [
      'What is the definition of an anticyclonic storm in planetary meteorology?',
      'Why does the Great Red Spot retain its reddish coloration?',
      'How deep into Jupiter’s atmosphere does this vortex extend according to Juno data?',
      'What wind velocities are measured around its perimeter?'
    ]
  },
  {
    id: 'moon-tycho',
    title: 'Tycho Crater & Ejecta Rays',
    celestialBody: 'Moon (Luna)',
    mission: 'Lunar Reconnaissance Orbiter (LROC)',
    imageUrl: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?auto=format&fit=crop&w=400&q=75',
    description: 'Orbital satellite imagery of the prominent southern lunar impact crater Tycho, showing its central peak and 1,500-km-long bright ejecta rays.',
    sampleQuestions: [
      'What is the definition of impact crater ejecta rays?',
      'How old is Tycho crater and how was its age determined?',
      'What caused the central mountain peak inside the crater?',
      'What satellite instruments on LRO map lunar topography?'
    ]
  },
  {
    id: 'europa-ice-crust',
    title: 'Europa Chaos Terrain & Ice Fractures',
    celestialBody: 'Europa (Moon of Jupiter)',
    mission: 'Galileo Orbiter & Juno Mission',
    imageUrl: 'https://images.unsplash.com/photo-1614728423169-3f65fd722b7e?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1614728423169-3f65fd722b7e?auto=format&fit=crop&w=400&q=75',
    description: 'Crisscrossing tectonic lineae, ridge bands, and disrupted chaos blocks floating above a subsurface liquid water ocean.',
    sampleQuestions: [
      'What is the definition of "Chaos Terrain" on icy moons?',
      'What tidal forces create these reddish-brown intersecting lineae?',
      'How do radar satellites penetrate the ice shell to measure ocean depth?',
      'What chemical salts are thought to stain these fractures?'
    ]
  },
  {
    id: 'earth-hurricane-orbit',
    title: 'Eye of the Cyclone & Cloud Spirals',
    celestialBody: 'Earth',
    mission: 'GOES-R / Sentinel-3 Earth Observation Satellite',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=75',
    description: 'Geostationary meteorological satellite view capturing intense atmospheric vortex formation, cloud eyewall, and Coriolis-driven spirals.',
    sampleQuestions: [
      'What is the meteorological definition of the stadium effect in a cyclone eyewall?',
      'How do infrared satellite bands distinguish cloud-top temperatures?',
      'What atmospheric thermodynamics drive this cyclonic circulation?',
      'How does satellite scatterometry measure ocean surface wind speed?'
    ]
  },
  {
    id: 'saturn-rings-cassini',
    title: 'Saturn Rings & Encke Gap',
    celestialBody: 'Saturn',
    mission: 'NASA Cassini-Huygens Orbiter (ISS)',
    imageUrl: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=1600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=400&q=75',
    description: 'Unprecedented backlit view of Saturn’s ring system, density waves, fine ringlets, and gravitational shepherd moon wakes.',
    sampleQuestions: [
      'What is the definition of an orbital resonance gap in planetary rings?',
      'What is the composition and average particle size in Saturn’s A and B rings?',
      'How did Cassini use stellar occultation to measure ring thickness?',
      'Why are the rings only a few tens of meters thick despite spanning thousands of kilometers?'
    ]
  }
];
