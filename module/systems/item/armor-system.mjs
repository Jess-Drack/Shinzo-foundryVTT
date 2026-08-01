export function prepareArmorData(system){

  if(!system)
    return;

  system.resPhysique = Number(system.resPhysique ?? 0);

  system.resMagique = Number(system.resMagique ?? 0);

  if(!Array.isArray(system.modifiers))
    system.modifiers = [];

  // Nettoyage des anciens modifiers d'armure
  system.modifiers =
    system.modifiers.filter(
      m =>
      m.target !== "rdp.res_physique.value" &&
      m.target !== "rdp.res_magique.value"
    );

  if(system.resPhysique > 0){

    system.modifiers.push({

      enabled:true,
      target:"rdp.res_physique.value",
      value:system.resPhysique,
      mode:"add",
      priority:0,
      type:"bonus"

    });

  }

  if(system.resMagique > 0){

    system.modifiers.push({

      enabled:true,
      target:"rdm.res_magique.value",
      value:system.resMagique,
      mode:"add",
      priority:0,
      type:"bonus"

    });

  }

}