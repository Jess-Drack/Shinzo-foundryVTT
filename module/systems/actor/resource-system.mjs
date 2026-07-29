/**
 * Préparation des ressources de l'acteur
 *
 * @param {object} systemData
 */
export function prepareResources(systemData) {

  prepareResource(
    systemData.health
  );


  prepareResource(
    systemData.power
  );

}



/**
 * Prépare une ressource
 *
 * @param {object} resource
 */
function prepareResource(resource) {

  if (!resource) return;


  resource.min = -resource.max;


  resource.value = Math.clamp(
    resource.value,
    resource.min,
    resource.max
  );

}