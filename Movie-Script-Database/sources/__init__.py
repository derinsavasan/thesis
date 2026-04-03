def get_scripts(source):
    if source == "imsdb":
        from .imsdb import get_imsdb
        get_imsdb()
    elif source == "screenplays":
        from .screenplays import get_screenplays
        get_screenplays()
    elif source == "scriptsavant":
        from .scriptsavant import get_scriptsavant
        get_scriptsavant()
    elif source == "weeklyscript":
        from .weeklyscript import get_weeklyscript
        get_weeklyscript()
    elif source == "dailyscript":
        from .dailyscript import get_dailyscript
        get_dailyscript()
    elif source == "awesomefilm":
        from .awesomefilm import get_awesomefilm
        get_awesomefilm()
    elif source == "sfy":
        from .sfy import get_sfy
        get_sfy()
    elif source == "scriptslug":
        from .scriptslug import get_scriptslug
        get_scriptslug()
    elif source == "actorpoint":
        from .actorpoint import get_actorpoint
        get_actorpoint()
    elif source == "scriptpdf":
        from .scriptpdf import get_scriptpdf
        get_scriptpdf()
    else:
        print("Invalid source.")
