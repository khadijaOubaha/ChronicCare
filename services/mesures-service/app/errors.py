
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("mesures-service")


class DomainError(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def _body(code: str, message: str, **extra) -> dict:
    return {"detail": {"code": code, "message": message, **extra}}


def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(DomainError)
    async def handle_domain_error(request: Request, exc: DomainError):
        return JSONResponse(
            status_code=exc.status_code,
            content=_body(exc.code, exc.message)
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        erreurs = [
            {
                "champ": ".".join(
                    str(p) for p in error["loc"]
                    if p not in ("body", "query", "path")
                ),
                "message": error["msg"],
            }
            for error in exc.errors()
        ]

        return JSONResponse(
            status_code=422,
            content=_body(
                "validation_error",
                "Les données envoyées sont invalides.",
                errors=erreurs,
            ),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception):
        logger.exception(
            "Erreur inattendue sur %s %s",
            request.method,
            request.url.path
        )

        return JSONResponse(
            status_code=500,
            content=_body(
                "erreur_interne",
                "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
            ),
        )
