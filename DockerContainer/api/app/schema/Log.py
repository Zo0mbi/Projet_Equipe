from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

class LogBase(BaseModel):
    user_id: Optional[int] = None
    categorie: str
    action: str
    type: str = "info"

class LogCreate(LogBase):
    pass

class LogResponse(LogBase):
    id: int
    date_entrer: datetime

    model_config = ConfigDict(from_attributes=True)
