/* jshint esversion: 6 */

function NiaiDB()
{
    this.override_db = {};
}


// #############################################################################
(function() {
   "use strict";

    NiaiDB.prototype = {
        constructor: NiaiDB,

        init: function(override_db)
        {
            this.override_db = override_db;
        },

        isKanjiInWK: function(kanji)
        {
            return (this.lookup_db[kanji].level !== 99);
        },

        isKanjiInDB: function(kanji)
        {
            return (kanji in this.lookup_db);
        },

        isKanjiLocked: function(kanji, level)
        {
            return (this.lookup_db[kanji].level > level);
        },

        getInfo: function(kanji)
        {
            let info = this.lookup_db[kanji];

            info.readings = info[info.important_reading];

            return this.lookup_db[kanji];
        },

        getSimilar: function(kanji, level, sources)
        {
            // use an object to override with later databases.
            let similar_kanji = {};

            sources.forEach(
                function(source)
                {
                    if (!(kanji in this[source.id]))
                        return;

                    this[source.id][kanji].forEach(
                        function(sim_info)
                        {
                            const hasScore = (
                                typeof sim_info !== `string` &&
                                `score` in sim_info
                            );

                            let sim_kanji = hasScore ? sim_info.kan : sim_info;
                            let score = source.base_score +
                                        (hasScore ? sim_info.score : 0);

                            if (score > 0.3)
                            {
                                similar_kanji[sim_kanji] = {
                                    "kan": sim_kanji,
                                    "score": score,
                                    "locked": this.isKanjiLocked(sim_kanji, level)
                                };
                            }
                            else if (score < 0)
                            {
                                // negative scores are used to delete unwanted
                                // kanji to make it consistent across all DBs
                                // including the user's local db.
                                delete similar_kanji[sim_kanji];
                            }
                        },
                        this
                    );
                },
                this
            );

            let result = Object.values(similar_kanji).sort(
                (a, b) => 10*(a.locked - b.locked) + (b.score - a.score));

            console.log("sort result is", result);

            return result.map((a) => a.kan);
        }
    };
}
());
// #############################################################################

// #############################################################################
NiaiDB.prototype.keisei_db      = JSON.parse(GM_getResourceText(`from_keisei`));
NiaiDB.prototype.old_script_db  = JSON.parse(GM_getResourceText(`old_script`));
NiaiDB.prototype.yl_radical_db  = JSON.parse(GM_getResourceText(`yl_radical`));
NiaiDB.prototype.stroke_dist_db = JSON.parse(GM_getResourceText(`stroke_dist`));
NiaiDB.prototype.manual_db      = JSON.parse(GM_getResourceText(`manual`));
NiaiDB.prototype.lookup_db      = JSON.parse(GM_getResourceText(`lookup`));
// #############################################################################