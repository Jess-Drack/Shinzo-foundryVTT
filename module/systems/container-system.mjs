export class ContainerSystem {


  /**
   * Vérifie si un item est un sac
   */
    static isContainer(itemData){

        return (
            itemData &&
            (
                itemData.type === "sac"
                ||
                itemData.system?.container === true
            )
        );

    }


  /**
   * Vérifie si un sac peut recevoir un item
   */
  static canInsert(container, itemData){

    if(!container || !itemData) return false;

    const containerType = container.type;

    /*
     * Interdit un sac dans un sac
     */
    if(containerType === "sac" && this.isContainer(itemData)){

      ui.notifications.warn("Impossible de placer un sac dans un autre sac.");

      return false;

    }

    if(itemData.type === "trait" || "competence"){

      ui.notifications.warn("Impossible de placer un sac.");

      return false;

    }

    return true;

  }


  /**
   * Ajoute un item dans un sac
   */
  static async addToContainer(container,itemData){

    if(!this.canInsert(container, itemData)){

      return false;

    }

    const content = foundry.utils.deepClone(container.system.content ?? []);

    const copy = foundry.utils.deepClone(itemData);

    copy._id = foundry.utils.randomID();

    const stack = this.findStack(content, copy);

    if (stack) {

        stack.system.quantity += copy.system.quantity ?? 1;

    } else {

        copy._id = foundry.utils.randomID();

        content.push(copy);

    }

    await this.saveContent(container, content);

    return copy;

  }

  /**
   * Retire un item d'un sac
   */
  static async removeFromContainer(container,itemId){

    if(!container) return null;

    const content = foundry.utils.deepClone(container.system.content ?? []);

    const index = content.findIndex(i => i._id === itemId);

    if(index === -1) return null;

    const removed = content.splice(index,1)[0];

    await this.saveContent(container, content);

    return removed;

  }


  /**
   * Déplace un item vers un acteur
   */
  static async moveToActor({actor, itemData, sourceContainer=null}){

    const copy = foundry.utils.deepClone(itemData);

    copy._id = foundry.utils.randomID();

    const existing = actor.items.find(i =>this.canStack(i, copy));

    if (existing) {

        await existing.update({
            "system.quantity":
                existing.system.quantity + copy.system.quantity
        });

    } else {

        await actor.createEmbeddedDocuments("Item", [copy]);

    }

    if(sourceContainer){

      await this.removeFromContainer(
        sourceContainer,
        itemData._id
      );

    }

    return copy;

  }


  /**
   * Déplace un item dans un sac
   */
  static async moveToContainer({container, itemData, sourceContainer=null}){

    const added = await this.addToContainer(container, itemData);

    /*
     * Si l'ajout est refusé
     * on ne touche pas à la source
     */
    if(!added){

      return false;

    }

    if(sourceContainer){

      await this.removeFromContainer(
        sourceContainer,
        itemData._id
      );

    }

    return added;

  }


  /**
   * Gestion globale des drops
   */
  static async handleDrop({data, actor=null, targetContainer=null}){

    /*
     * Depuis un sac
     */
    if(data.fromContainer){

      const itemData = foundry.utils.deepClone(data.data);

      const sourceContainer = await fromUuid(data.containerUuid);

      if(targetContainer){

        return this.moveToContainer({

          container:targetContainer,

          itemData,

          sourceContainer

        });

      }

      if(actor){

        return this.moveToActor({

          actor,

          itemData,

          sourceContainer

        });

      }

      return false;

    }

    /*
     * Depuis un Item Foundry classique
     */
    if(data.uuid){

      const item = await fromUuid(data.uuid);

      if(!item) return false;

      /*
      * Empêche un item de se recréer
      * dans le même inventaire
      */
      if(actor && item.actor && item.actor.id === actor.id){

          return false;

      }

      const itemData = item.toObject();

      /*
       * Vers un sac
       */
      if(targetContainer){

        const result = await this.addToContainer(
            targetContainer,
            itemData
          );

        if(!result) return false;

        /*
         * Suppression de l'inventaire
         */
        if(item.actor){

          await item.delete();

        }

        return result;

      }

      /*
       * Vers personnage
       */
      if(actor){

        return this.moveToActor({
            actor,
            itemData
        });

      }

    }

    return false;

  }


  static async updateContainedItem(container, itemId, formData){

        const content = foundry.utils.deepClone(container.system.content ?? []);

        const index = content.findIndex(i => i._id === itemId);

        if(index === -1) return;

        const update = foundry.utils.expandObject(formData);

        foundry.utils.mergeObject(
            content[index],
            update,
            {
                inplace:true
            }
        );

        await this.saveContent(container, content);

    }


    static async saveContent(container, content) {

        return container.update({
            "system.content": content
        });
        
    }

    //Détermine si deux objets peuvent fusionner (ex: stack potion)
    static canStack(itemA, itemB) {

    if (!itemA.system.stackable || !itemB.system.stackable)
        return false;

    if (itemA.type !== itemB.type)
        return false;

    return (
        itemA.name === itemB.name &&
        itemA.system.quality === itemB.system.quality
    );

  }


  //Chercher une pile existante
  static findStack(content, itemData) {

    return content.find(i => this.canStack(i, itemData));

  }

}